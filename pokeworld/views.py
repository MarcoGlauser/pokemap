import json
import struct

import requests
from django.conf import settings
from django.db.utils import IntegrityError
from django.http import HttpResponse
from django.http.response import HttpResponseBadRequest
from geopy import Point
from geopy.distance import GreatCircleDistance
from pgoapi import PGoApi
from pokeworld.models import Pokemon
from pokeworld.tasks import get_cell_ids
from ws4redis.publisher import RedisPublisher
from ws4redis.redis_store import RedisMessage


def asdf(request):
    config = settings.PGOAPI_CONFIG

    if request.GET['latitude'] and request.GET['longitude']:
        position = float(request.GET['latitude']), float(request.GET['longitude']), 0
    else:
        return HttpResponseBadRequest()
    # instantiate pgoapi
    api = PGoApi()

    # provide player position on the earth
    api.set_position(*position)

    if not api.login(config['auth_service'], config['username'], config['password']):
        return HttpResponse('Unauthorized', status=401)

    map_objects = get_map_objects_call(api,position)
    wild_pokemons = parse_wild_pokemon(map_objects)
    broadcast_wild_pokemon(wild_pokemons)

    steps = 6
    distance = 150
    degrees = generate_swirl_degrees(steps)
    for i in range(0,steps*steps-1):
        print ('-----------------------')
        print (str(i) + ' step')
        position = GreatCircleDistance(meters=distance).destination(Point(position[0],position[1]),degrees[i])
        map_objects = get_map_objects_call(api,position)
        wild_pokemons = parse_wild_pokemon(map_objects)
        broadcast_wild_pokemon(wild_pokemons)

    return HttpResponse()


def get_map_objects_call(api,position):

    cell_ids = get_cell_ids(position[0], position[1])
    timestamps = [0, ] * len(cell_ids)
    api.set_position(position[0],position[1],0)
    api.get_map_objects(latitude=f2i(position[0]), longitude=f2i(position[1]), since_timestamp_ms=timestamps, cell_id=cell_ids)
    return api.call()

def broadcast_wild_pokemon(wild_pokemons):
    redis_publisher = RedisPublisher(facility='wild_pokemon', broadcast=True)
    message = RedisMessage(json.dumps(wild_pokemons))
    redis_publisher.publish_message(message)

def parse_wild_pokemon(response_dict):
    wild_pokemons = []
    if response_dict['responses'].get('GET_MAP_OBJECTS') and response_dict['responses']['GET_MAP_OBJECTS'].get('map_cells'):
        for s2_cell in response_dict['responses']['GET_MAP_OBJECTS']['map_cells']:
            if s2_cell.get('wild_pokemons'):
                print (str(len(s2_cell.get('wild_pokemons'))) +' Wild Pokemon found!')
                for wild_pokemon in s2_cell.get('wild_pokemons'):
                    wild_pokemons.append(format_wild_pokemon(wild_pokemon))

    return wild_pokemons

def format_wild_pokemon(pokemon_instance):
    pokemon_number = pokemon_instance['pokemon_data']['pokemon_id']
    try:
        pokemon_base = Pokemon.objects.get(number=pokemon_number)
        pokemon_name = pokemon_base.name
    except Pokemon.DoesNotExist:
        data = fetch_pokemon_from_api(pokemon_number)
        pokemon_name = data['name']
        try:
            Pokemon.objects.create(number=pokemon_number,name=data['name'])
        except IntegrityError:
            pass

    return {
        'runaway_timestamp': pokemon_instance['last_modified_timestamp_ms'] + pokemon_instance['time_till_hidden_ms'],
        'latitude': pokemon_instance['latitude'],
        'longitude': pokemon_instance['longitude'],
        'id': pokemon_instance['encounter_id'],
        'pokemon_number': pokemon_number,
        'pokemon_name': pokemon_name
    }

def fetch_pokemon_from_api(number):
    response = requests.get('https://pokeapi.co/api/v2/pokemon/'+ str(number) +'/')
    return response.json()

def f2i(float):
  return struct.unpack('<Q', struct.pack('<d', float))[0]

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