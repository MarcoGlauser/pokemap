from django.conf import settings
from django.http import HttpResponse
from django.http.response import HttpResponseBadRequest
from geopy import Point
from geopy.distance import GreatCircleDistance
from tasks import get_map_objects_and_send_to_websocket,generate_swirl_degrees


def scan(request):

    if request.GET['latitude'] and request.GET['longitude']:
        position = float(request.GET['latitude']), float(request.GET['longitude']), 0
    else:
        return HttpResponseBadRequest()

    get_map_objects_and_send_to_websocket.delay(position)

    steps = settings.NUMBER_OF_STEPS
    distance = settings.STEP_DISTANCE

    degrees = generate_swirl_degrees(steps)
    for i in range(0,steps*steps-1):
        position = GreatCircleDistance(meters=distance).destination(Point(position[0],position[1]),degrees[i])
        get_map_objects_and_send_to_websocket.delay((position[0],position[1],0))

    return HttpResponse()
