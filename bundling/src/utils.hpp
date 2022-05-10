#ifndef __UTILS_HPP__
#define __UTILS_HPP__

#include <vector>
#include <string>
#include <cmath>
#include <iostream>

#include "models.hpp"

using namespace std;

double const SQRT_2PI = std::sqrt(2 * M_PI);

inline float gauss_1d(double sigma, double x)
{
  return std::exp(-((x * x) / (2 * sigma * sigma)));
}

inline std::vector<double> gauss_kernel_1d(double sigma)
{
  int size = std::ceil(2 * sigma);
  std::vector<double> kernel(size * 2 + 1);
  double kernel_sum = 0;
  for (int i = -size; i <= size; i++)
  {
    kernel[i + size] = gauss_1d(sigma, i);
    kernel_sum += kernel[i + size];
  }
  for (int i = 0; i < size * 2 + 1; i++)
  {
    kernel[i] /= kernel_sum;
  }
  return kernel;
}

const string WHITESPACE = " \n\r\t\f\v";
 
string ltrim(const std::string &s)
{
    size_t start = s.find_first_not_of(WHITESPACE);
    return (start == string::npos) ? "" : s.substr(start);
}
 
string rtrim(const std::string &s)
{
    size_t end = s.find_last_not_of(WHITESPACE);
    return (end == string::npos) ? "" : s.substr(0, end + 1);
}
 
string trim(const string &s) {
    return rtrim(ltrim(s));
}

double magnitude(double x, double y){
	return sqrt(x*x + y*y);
}

const double R = 100;
const double radians = M_PI / 180.0;
double sp1 = 33 * radians;
double sp2 = 45 * radians;
double lat_ref = 39.8333 * radians;
double lon_ref = -98.5855 * radians;
double n = sp1 != sp2 ? log(cos(sp1) / cos(sp2)) / log(tan(M_PI_4 + 0.5*sp2) / tan(M_PI_4 + 0.5*sp1)) : sin(sp1);
double F = (cos(sp1) * pow(tan(M_PI_4 + 0.5*sp1), n)) / n;
double ro_ref = (R*F) / pow(tan(M_PI_4 + 0.5*lat_ref), n);
Point conformalConicProjection(double lon, double lat) {
  double ro = (R*F) / pow(tan(M_PI_4 + 0.5*lat*radians), n);
  double theta = n*(lon*radians-lon_ref);
  double x = ro*sin(theta);
  double y = ro_ref - ro*cos(theta);
  return Point(x, y);
}

Point inverseConformalConicProjection(double x, double y) {
  double ro = ((0 < n) - (n < 0)) * sqrt(x*x + pow(ro_ref - y, 2));
  double theta = atan2(x, ro_ref - y);
  double lon = theta / n + lon_ref;
  double lat = 2 * atan(pow((R*F) / ro, 1/n)) - M_PI_2;
  return Point(lon / radians, lat / radians);
}

#endif // __UTILS_HPP__
