from django.test import TestCase


class asdasdTest(TestCase):

    def testasdasd(self):
        squares = []
        degrees = [0,]
        steps = 2
        current_step = 0
        counter = 1
        degreeshift = 90
        current_degree = 0
        for i in range(1, steps+1):
            squares.append(i*i-1)
        for i in range(2,squares[-1]+1):
            if i in squares:
                counter += 1
                if current_step != 0:
                    current_step +=1
            if current_step <= 0:
                current_degree += degreeshift
                current_step = counter
            degrees.append(current_degree)
            current_step -= 1


        print degrees