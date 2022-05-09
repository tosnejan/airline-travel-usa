#include <cmath>
using namespace std;

class Edge;
class Node;

vector<Edge> edges;
vector<Node> nodes;

class Point{
public:
	double x, y;
	Point(){
		this->x = 0;
		this->y = 0;
	}
	Point(double x, double y){
		this->x = x;
		this->y = y;
	}
	inline Point operator- (const Point other) const { return Point(x - other.x, y - other.y); }
	inline Point operator+ (const Point &other) const { return Point(x + other.x, y + other.y); }
	inline void operator+= (const Point &other) { 
		x += other.x;
		y += other.y;
	}
	inline Point operator* (const double other) const { return Point(x * other, y * other); }
	inline void operator*= (const double other) { 
		x *= other;
		y *= other;
	}
};

class Direction
{
public:
	double x,y;
	double length;
	double normX, normY;
	Direction() {
		this->x = 0;
		this->y = 0;
	}
	Direction(double x, double y) {
		this->x = x;
		this->y = y;
		size();
		normX = x / length;
		normY = y / length;
	}
	Direction(Point p) {
		x = p.x;
		y = p.y;
		length = sqrt(x*x + y*y);
		normX = x / length;
		normY = y / length;
	}
	inline double size() {
		length = sqrt(x*x + y*y);
		return length;
	}
	inline Direction normalized(){
		double l = size();
		return Direction(x/l, y/l);
	}
	inline Point point(){
		return Point(x,y);
	}
	inline Direction operator- (const Direction other) const { return Direction(x - other.x, y - other.y); }
	inline Direction operator+ (const Direction &other) const { return Direction(x + other.x, y + other.y); }
	inline void operator+= (const Direction &other) { 
		x += other.x;
		y += other.y;
	}
	inline Direction operator* (const double other) const { return Direction(x * other, y * other); }
	inline void operator*= (const double other) { 
		x *= other;
		y *= other;
	}
};


class Node{
public:
	int id;
	int arrivals = 0;
	int departures = 0;
	double x;
	double y;
	string tooltip;
	Node(int id, double x, double y, string tooltip) : id(id), x(x), y(y), tooltip(tooltip){}
};

class Edge{ 
public:
	int id;
	int from;
	int to;
	double length;
	double kp;
	Direction dir;
	Direction normal;
	vector<Point> points;
	vector<Direction> directions = vector<Direction>(63);
	Edge(int id, int from, int to): id(id), from(from), to(to) {
		dir = Direction(nodes[to].x - nodes[from].x, nodes[to].y - nodes[from].y);
		normal = Direction(dir.y, -dir.x);
		length = magnitude(dir.x, dir.y);
		kp = 2 / length;
		points.reserve(65);
		points.push_back(Point(nodes[from].x, nodes[from].y));
		points.push_back(Point(nodes[to].x, nodes[to].y));
	}

	Point first(){
		return points[0];
	}

	Point midpoint(){
		return points[0] * 0.5 + last() * 0.5;
	}

	Point last(){
		return points.back();
	}

	void updatePoints(int count){
		int prevCount = points.size();

		// avoid emplace?
		for (int i = 1; i < prevCount; i++){
			Point insert = points[2*i-2]*0.5 + points[2*i-1]*0.5;
			points.emplace(points.begin() + 2*i-1, insert.x, insert.y);
		}

		for (int i = 0; i < count; i++){
			directions[i] = Direction();
		}

		// this is maybe wrong :(
		// maybe update this with sum of segment lengths
		kp = (count+1) / (length);
	}

	void movePoints(double count, double step){
		double l = 0;
		for (int i = 0; i < count; i++) {
			points[i+1] += (directions[i] * step).point();
			directions[i] = Direction();
			l += Direction(points[i] - points[i+1]).length;
		}
		l += Direction(points[count] - points[count+1]).length;
		length = l;
		kp = (count+1) / (length);
	}
};