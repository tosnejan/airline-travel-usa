#include "stb/stb.h"
#include <iostream>
#include <fstream>
#include <vector>
#include <set>
#include <string>
#include <math.h>
using namespace std;
#define coord(x, y, c, w) ((y)*w*3 + (x)*3 + c)

class Edge;
class Node;

vector<Edge> edges;
vector<Node> nodes;
set<int>* foundEdges;

double magnitude(double x, double y){
	return sqrt(x*x + y*y);
}

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
		for (int i = 0; i < count; i++) {
			points[i+1] += (directions[i] * step).point();
			directions[i] = Direction();
		}
	}
};

double Ca(Edge &p, Edge &q){
	return abs((p.dir.x * q.dir.x + p.dir.y * q.dir.y) / (p.length * q.length));
}

double Cs(Edge &p, Edge &q){
	double avg = (p.length + q.length)/2;
	return 2 / (min(p.length, q.length)/avg + max(p.length, q.length) / avg);
}

double Cp(Edge &p, Edge &q){
	double l = (p.length + q.length)/2;
	Direction x = p.midpoint() - q.midpoint();
	return l / (l + x.length);
}

double V(Edge &p, Edge &q){
	Point p0 = p.first();
	Point q0 = q.first(), q1 = q.last(), qm = q.midpoint();
	double size = p.dir.normX*q.normal.normY - p.dir.normY*q.normal.normX;
	double t0 = (q.normal.normY*(q0.x - p0.x) + q.normal.normX*(p0.y - q0.y)) / size;
	double t1 = (q.normal.normY*(q1.x - p0.x) + q.normal.normX*(p0.y - q1.y)) / size;
	double tm = (q.normal.normY*(qm.x - p0.x) + q.normal.normX*(p0.y - qm.y)) / size;
	Point i0 = p0 + Point(p.dir.normX*t0, p.dir.normY*t0);
	Point i1 = p0 + Point(p.dir.normX*t1, p.dir.normY*t1);
	Point im = p0 + Point(p.dir.normX*tm, p.dir.normY*tm);
	return max(1 - (2 * Direction(p.midpoint() - im).length) / Direction(i0 - i1).length, 0.0);
}

double Cv(Edge &p, Edge &q){
	return min(V(p, q), V(q, p));
}

double Ce(Edge &p, Edge &q){
	//double ca = Ca(p, q), cs = Cs(p,q), cp = Cp(p,q), cv = Cv(p,q);
	// double ret = ca*cs*cp*cv;
	// cout << "Ca: " << ca << ", Cs: " << cs << ", Cp: " << cp << ", Cv: " << cv << ", ret: " << ret << endl;
	return Ca(p, q)*Cs(p,q)*Cp(p,q)*Cv(p,q);
}

void iterate(int cycles){
	int edgeCount = edges.size();
	double *compatibilities = new double[edgeCount*edgeCount];
	cout << "Calculating compatibilities..." << endl;
	#pragma omp parallel for
	for (int p = 0; p < edgeCount; p++) {
		for (int q = p; q < edgeCount; q++) {
			// We don't want to be affected by the same Edge.
			if (p == q) {
				compatibilities[p*edgeCount + q] = 0;
				continue;
			};
			double compatibility = Ce(edges[p], edges[q]);
			compatibilities[p*edgeCount + q] = compatibility;
			compatibilities[q*edgeCount + p] = compatibility;
		}
	}
	cout << "Starting FDEB..." << endl;
	vector<int> P = {1, 3, 7, 15, 31, 63};
	vector<int> I = {50, 33, 22, 15, 9, 7};
	vector<double> S = {0.4, 0.02, 0.01, 0.005, 0.0025, 0.00125};
	// Cyclus that changes parameters.
	for (int cycle = 0; cycle < cycles && cycle < 6; cycle++){
		std::cout << "cycle: " << cycle << endl;
		// Recalculates positions of points because count of points has changed.
		for (int i = 0; i < edgeCount; i++){
			edges[i].updatePoints(P[cycle]);
		}
		// Iterations of algorithm
		for (int i = 0; i < I[cycle]; i++){
			std::cout << "iteration: " << i + 1 << "/"<< I[cycle] << endl;
			// Stores the directions where should every subpoint of Edge move.
			for (int p = 0; p < edgeCount; p++){
				for (int q = 0; q < edgeCount; q++) {
					// We don't want to be affected by the same Edge.
					if (p == q) continue;
					// this can be calculated one per Edge at start j is not important
					double compatibility = compatibilities[q*edgeCount + p];
					// Threshhold so it will ignore almost irelevant edges.
					if(compatibility < 0.05) continue;
					for (int j = 0; j < P[cycle]; j++) {
						// Direction between subpoints.
						Direction dir = Direction(edges[q].points[j+1] - edges[p].points[j+1]);
						if(abs(dir.x) < 0.5 && abs(dir.y) < 0.5){
							continue;
						}
						// Direction between subpoints but normalized and scaled by compatibility.
						dir = dir.normalized() * (compatibility / dir.length);
						edges[p].directions[j] += dir;
					}
				}
				// Add forces by adjusting points on line
				for (int j = 0; j < P[cycle]; j++) {
					Direction dirMinus = edges[p].points[j] - edges[p].points[j+1];
					Direction dirPlus = edges[p].points[j+2] - edges[p].points[j+1];
					edges[p].directions[j] += (dirMinus+dirPlus) * edges[p].kp;
				}
			}
			// Apply directions scaled by S.
			for (int p = 0; p < edgeCount; p++){
				edges[p].movePoints(P[cycle], S[cycle]);
			}
		}
		
	}
	delete []compatibilities;
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

int main(){
	set<int>* foundEdges = new set<int>[nodes.size()];
	ifstream in("airlines.graphml");
	double minX = 10000, minY = 10000, maxX = -10000, maxY = -10000;
	if (in.is_open()){
		string line;
		while (getline(in, line)){
			line = trim(line);
			if (line.find("<!-- nodes -->") != string::npos){
				getline(in, line);
				while (line != ""){
					int id = 0;
					double x = 0, y = 0;
					string tooltip(100, ' ');
					sscanf(line.c_str(), "<node id=\"%d\">", &id);
					getline(in, line);
					line = trim(line);
					sscanf(line.c_str(), "<data key=\"x\">%lf</data>", &x);
					getline(in, line);
					line = trim(line);
					sscanf(line.c_str(), "<data key=\"tooltip\">%s %*u</data>", tooltip.data());
					getline(in, line);
					line = trim(line);
					sscanf(line.c_str(), "<data key=\"y\">%lf</data>", &y);
					// cout << x << " " << y << " " << tooltip.c_str() << endl;
					nodes.push_back(Node(id, x, y, tooltip));
					if (minX > x) minX = x;
					if (maxX < x) maxX = x;
					if (minY > y) minY = y;
					if (maxY < y) maxY = y;
					getline(in, line);
					getline(in, line);
					line = trim(line);
				}
			}
			if (line.find("<!-- edges -->") != string::npos){
				getline(in, line);
				line = trim(line);
				int edgeCounter = 0;
				foundEdges = new set<int>[nodes.size()];
				while (line.find("</graph>") == string::npos){
					int id = 0, source = 0, target = 0;
					sscanf(line.c_str(), "<edge id=\"%d\" source=\"%d\" target=\"%d\">", &id, &source, &target);
					nodes[target].arrivals++;
					nodes[source].departures++;
					// Edges are sorted by source
					if(foundEdges[source].find(target) == foundEdges[source].end() && 
							foundEdges[target].find(source) == foundEdges[target].end()) {
						edges.push_back(Edge(edgeCounter++, source, target));
						foundEdges[target].insert(source);
					}
					getline(in, line);
					getline(in, line);
					line = trim(line);
				}
				delete [] foundEdges;
			}
			
    }
		in.close();
	} else {
		std::cout << "Unable to open file" << endl;
		return 404;
	}

	iterate(5);

	// Here should be saving to file.

	double xShift = -minX + 10, yShift = -minY + 10;
	int width = maxX + xShift + 10, height = maxY + yShift + 10;

	stbi_uc* img = (stbi_uc*)calloc(width * height * 3, sizeof(stbi_uc));
	for (int y = 0; y < height; y++){
		for (int x = 0; x < width; x++){
			img[coord(x, y, 0, width)] = 255;
			img[coord(x, y, 1, width)] = 255;
			img[coord(x, y, 2, width)] = 255;
		}
	}
	cout << minX << " " << minY << " " << maxX << " " << maxY << endl;
	for (int i = 0; i < 10; i++){
		int color = 0;
		for (Point &p : edges[i].points){
			int xCoord = p.x + xShift, yCoord = p.y + yShift;
			for (int y = -1; y < 2; y++){
				for (int x = -1; x < 2; x++){
				img[coord(xCoord+x, yCoord+y, 0, width)] = color*3;
				img[coord(xCoord+x, yCoord+y, 1, width)] = color*3;
				img[coord(xCoord+x, yCoord+y, 2, width)] = color*3;
				}
			}
			color++;
		}
	}
	
	int counter = 0;
	for (int i = 0; i < nodes.size(); i++){
		int xCoord = nodes[i].x + xShift, yCoord = nodes[i].y + yShift;
		for (int y = -1; y < 2; y++){
			for (int x = -1; x < 2; x++){
				img[coord(xCoord + x, yCoord + y, 1, width)] = 0;
				img[coord(xCoord + x, yCoord + y, 2, width)] = 0;
				if(edges[0].from == i || edges[0].to == i){
					img[coord(xCoord + x, yCoord + y, 1, width)] = 0;
					img[coord(xCoord + x, yCoord + y, 2, width)] = 255;
					img[coord(xCoord + x, yCoord + y, 3, width)] = 0;
				}
			}
		}
		counter++;
	}

	ofstream outputFile("airports-data.json");
	// JSON beginning
	outputFile << "{\n";
	outputFile << "\"nodes\": [\n";
	for (Node &n : nodes){
		outputFile << "{";
		outputFile << "\"id\": " << n.id << ", ";
		outputFile << "\"code\": " << "\"" << n.tooltip.substr(0, 3) << "\"" << ", ";
		outputFile << "\"dep\": " << n.departures << ", ";
		outputFile << "\"arr\": " << n.arrivals << ", ";
		outputFile << "\"position\": [" << n.x << ", "  << n.y <<"]";
		outputFile << "}" << (nodes.size() - 1 != n.id ? "," : "") << "\n";
	}
	outputFile << "], \n";
	outputFile << "\"edges\": [\n";
	for (Edge &e : edges){
		outputFile << "{ ";
		outputFile << "\"id\": " << e.id << ", ";
		outputFile << "\"source\": " << e.from << ", ";
		outputFile << "\"target\": " << e.to << ", ";
		outputFile << "\"points\": ["; 
		for(int i = 0; i < (int)e.points.size(); i++){
			outputFile << "[" << e.points[i].x << ", "  << e.points[i].y <<"]";
			outputFile << (e.points.size() - 1 != i ? ", " : "");
		}
		outputFile << "]";
		outputFile << "}" << (edges.size() - 1 != e.id ? "," : "") << "\n";
	}
	outputFile << "]\n";
	// JSON end
	outputFile << "}\n";
	outputFile.close();

	
	stbi_write_png("image.png", width, height, 3, img, 0);

	stbi_image_free(img);

}