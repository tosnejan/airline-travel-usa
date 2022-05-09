#include <vector>
#include <string>
#include <cmath>
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
