import json
import struct

import requests
from celery.task import task
from django.db import IntegrityError
from google.protobuf.internal import encoder
from pgoapi.pgoapi import f2i
from pokeworld.models import Pokemon
from s2sphere import CellId, LatLng
from ws4redis.publisher import RedisPublisher
from ws4redis.redis_store import RedisMessage

@task
def get_map_objects_and_send_to_websocket(pgoapi, position):
    map_objects = get_map_objects_call(pgoapi, position)
    wild_pokemons = parse_wild_pokemon(map_objects)
    broadcast_wild_pokemon(wild_pokemons)

def get_map_objects_call(pgoapi, position):
    cell_ids = get_cell_ids(position[0], position[1])
    timestamps = [0, ] * len(cell_ids)
    pgoapi.set_position(position[0], position[1], 0)
    pgoapi.get_map_objects(latitude=f2i(position[0]), longitude=f2i(position[1]), since_timestamp_ms=timestamps, cell_id=cell_ids)
    return pgoapi.call()

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

def get_cellid(lat, long):
    origin = CellId.from_lat_lng(LatLng.from_degrees(lat, long)).parent(15)
    walk = [origin.id()]

    # 10 before and 10 after
    next = origin.next()
    prev = origin.prev()
    for i in range(10):
        walk.append(prev.id())
        walk.append(next.id())
        next = next.next()
        prev = prev.prev()
    return ''.join(map(encode, sorted(walk)))

def get_cell_ids(lat, long, radius = 10):
    origin = CellId.from_lat_lng(LatLng.from_degrees(lat, long)).parent(15)
    walk = [origin.id()]
    right = origin.next()
    left = origin.prev()

    # Search around provided radius
    for i in range(radius):
        walk.append(right.id())
        walk.append(left.id())
        right = right.next()
        left = left.prev()

    # Return everything
    return sorted(walk)

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

def encode(cellid):
    output = []
    encoder._VarintEncoder()(output.append, cellid)
    return ''.join(output)

