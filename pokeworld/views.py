import json

import time

from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import render
from geopy import Point
from geopy.distance import VincentyDistance, GreatCircleDistance
from pgoapi.pgoapi import PGoApi, f2i
from pokeworld.tasks import get_pos_by_name, get_cellid
from ws4redis.publisher import RedisPublisher
from ws4redis.redis_store import RedisMessage


def asdf(request):
    config = settings.PGOAPI_CONFIG

    #position = get_pos_by_name(config['location'])
    position = -16.918469, 145.780691, 0
    # instantiate pgoapi
    api = PGoApi()

    # provide player position on the earth
    api.set_position(*position)

    if not api.login(config['auth_service'], config['username'], config['password']):
        return

    map_objects = get_map_objects_call(api,position)
    wild_pokemons = parse_wild_pokemon(map_objects)
    broadcast_wild_pokemon(wild_pokemons)

    steps = 5
    distance = 150
    degrees = generate_swirl_degrees(steps)
    for i in range(0,steps*steps-1):
        print ('-----------------------')
        print (str(i) + ' step')
        position = GreatCircleDistance(meters=distance).destination(Point(position[0],position[1]),degrees[i])
        map_objects = get_map_objects_call(api,position)
        wild_pokemons = parse_wild_pokemon(map_objects)
        broadcast_wild_pokemon(wild_pokemons)
        time.sleep(2)

    return HttpResponse(json.dumps(wild_pokemons))


def get_map_objects_call(api,position):
    timestamp = "\000\000\000\000\000\000\000\000\000\000\000\000\000\000\000\000\000\000\000\000\000"
    cellid = get_cellid(position[0], position[1])
    api.set_position(position[0],position[1],0)
    api.get_map_objects(latitude=f2i(position[0]), longitude=f2i(position[1]), since_timestamp_ms=timestamp, cell_id=cellid)
    return api.call()

def broadcast_wild_pokemon(wild_pokemons):
    redis_publisher = RedisPublisher(facility='wild_pokemon', broadcast=True)
    message = RedisMessage(json.dumps(wild_pokemons))
    redis_publisher.publish_message(message)

def parse_wild_pokemon(response_dict):
    wild_pokemons = []
    for s2_cell in response_dict['responses']['GET_MAP_OBJECTS']['map_cells']:
        if s2_cell.get('wild_pokemons'):
            print ('Wild Pokemon found!')
            for wild_pokemon in s2_cell.get('wild_pokemons'):
                print '#' + str(wild_pokemon['pokemon_data']['pokemon_id'])
                wild_pokemons.append(wild_pokemon)

    return wild_pokemons

def generate_swirl_degrees(steps):
    squares = []
    degrees = [0, ]
    current_step = 0
    counter = 1
    degreeshift = 90
    current_degree = 0
    for i in range(1, steps + 1):
        squares.append(i * i - 1)
    for i in range(2, squares[-1] + 1):
        if i in squares:
            counter += 1
            if current_step != 0:
                current_step += 1
        if current_step <= 0:
            current_degree += degreeshift
            current_step = counter
        degrees.append(current_degree)
        current_step -= 1

    return degrees