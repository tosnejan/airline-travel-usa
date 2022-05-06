#include "stb/stb.h"
#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <math.h>
using namespace std;
#define coord(x, y, c, w) ((y)*w*3 + (x)*3 + c)

class edge;
class node;

vector<edge> edges;
vector<node> nodes;

double magnitude(double x, double y){
	return sqrt(x*x + y*y);
}

class point{
public:
	double x;
	double y;
	double length;
	double normX = 0;
	double normY = 0;
	point(double x, double y) : x(x), y(y){
		length = magnitude(x, y);
		if (length != 0){
			normX = x / length;
			normY = y / length;
		}
	}
	point normalized(){
		return point(normX, normY);
	}
    inline point operator- (const point other) const { return point(x - other.x, y - other.y); }
    inline point operator+ (const point other) const { return point(x + other.x, y + other.y); }
    inline void operator+= (const point other) { 
		x += other.x;
		y += other.y;
		length = magnitude(x, y);
		if (length != 0){
			normX = x / length;
			normY = y / length;
		}
	}
    inline point operator* (const double other) const { return point(x * other, y * other); }
    inline void operator*= (const double other) { 
		x *= other;
		y *= other;
		length = magnitude(x, y);
		if (length != 0){
			normX = x / length;
			normY = y / length;
		}
	}
};


class node{
public:
	int id;
	double x;
	double y;
	string tooltip;
	node(int id, double x, double y, string tooltip) : id(id), x(x), y(y), tooltip(tooltip){}
};

class edge{
public:
	int id;
	int from;
	int to;
	double length;
	double dirX;
	double dirY;
	double kp;
	point dir = point(0, 0);
	vector<point> points;
	edge(int id, int from, int to) : id(id), from(from), to(to){
		dirX = nodes[to].x - nodes[from].x;
		dirY = nodes[to].y - nodes[from].y;
		dir = point(nodes[to].x - nodes[from].x, nodes[to].y - nodes[from].y);
		length = magnitude(dirX, dirY);
		kp = 2/length;
		points.push_back(point(nodes[from].x, nodes[from].y));
		points.push_back(point(nodes[from].x + dirX/2, nodes[from].y + dirY/2));
		points.push_back(point(nodes[to].x, nodes[to].y));
	}

	point first(){
		return points[0];
	}

	point midpoint(){
		return points[(int)points.size()/2];
	}

	point last(){
		return points[points.size()-1];
	}

	void updatePoints(int count){
		if (points.size() == count + 2) return;
		// double len = 0;
		// for (int i = 1; i < points.size(); i++){
		// 	point p = points[i] - before;
		// 	len += p.length;
		// 	before = points[i];
		// }
		double step = length / (count+1);
		vector<point> pointsNew;
		pointsNew.push_back(first());
		double currLength = 0;
		double nextLength = step;
		point before = first();
		for (int i = 1; i < points.size(); i++){
			point p = points[i] - before;
			if (currLength + p.length > nextLength){
				double size = nextLength - currLength;
				pointsNew.push_back(point(before.x + p.normX*size, before.y + p.normY*size));
				nextLength += step;
				i--;
			} else {
				before = points[i];
				currLength += p.length;
			}
		}
		pointsNew.push_back(last());
		points = pointsNew;
		before = first();
		length = 0;
		for (int i = 1; i < points.size(); i++){
			point p = points[i] - before;
			length += p.length;
			before = points[i];
		}
	}

	void movePoints(vector<point> directions, double step){
		for (int i = 1; i < points.size()-1; i++){
			points[i] += directions[i-1].normalized() * step;
		}
		point before = first();
		length = 0;
		for (int i = 1; i < points.size(); i++){
			point p = points[i] - before;
			length += p.length;
			before = points[i];
		}
	}
};

double Ca(edge p, edge q, int i){
	return abs((p.points[i].x * q.points[i].x + p.points[i].y - q.points[i].y) / (p.length * q.length));
}

double Cs(edge p, edge q){
	double l = (p.length + q.length)/2;
	return 2 / (l * min(p.length, q.length) + max(p.length, q.length) / l);
}

double Cp(edge p, edge q){
	double l = (p.length + q.length)/2;
	int m = p.points.size()/2;
	double x = p.points[m].x - q.points[m].x;
	double y = p.points[m].y - q.points[m].y;
	return l / (l + sqrt(x*x + y*y));
}

double V(edge p, edge q){
	point pm = p.midpoint();
	if (p.dirX > p.dirY){
		double x = 1;
		double y = p.dirY / p.dirX;
		point i0(0, 0), i1(0, 0);
		if (q.first().x > q.last().x){
			i0.x = q.last().x;
			i0.y = y * q.last().x;
			i1.x = q.first().x;
			i1.y = y * q.first().x;
		} else {
			i0.x = q.first().x;
			i0.y = y * q.first().x;
			i1.x = q.last().x;
			i1.y = y * q.last().x;
		}
		point im(i0.x + (i1.x - i0.x)/2, i0.y + (i1.y - i0.y)/2);
		point a(pm.x - im.x, pm.y - im.y);
		point b(i0.x - i1.x, i0.y - i1.y);
		return max(1 - ((2 * sqrt(a.x*a.x + a.y*a.y))/(sqrt(b.x*b.x + b.y*b.y))), 0.);
	} else {
		double y = 1;
		double x = p.dirX / p.dirY;
		point i0(0, 0), i1(0, 0);
		if (q.first().y > q.last().y){
			i0.x = x * q.last().y;
			i0.y = q.last().y;
			i1.x = x * q.first().y;
			i1.y = q.first().y;
		} else {
			i0.x = x * q.first().y;
			i0.y = q.first().y;
			i1.x = x * q.last().y;
			i1.y = q.last().y;
		}
		point im(i0.x + (i1.x - i0.x)/2, i0.y + (i1.y - i0.y)/2);
		point a(pm.x - im.x, pm.y - im.y);
		point b(i0.x - i1.x, i0.y - i1.y);
		return max(1 - ((2 * sqrt(a.x*a.x + a.y*a.y))/(sqrt(b.x*b.x + b.y*b.y))), 0.);
	}
}

double Cv(edge p, edge q){
	return min(V(p, q), V(q, p));
}

double Ce(edge p, edge q, int i){
	return Ca(p, q, i) * Cs(p, q) * Cp(p, q);
}

void iterate(int cycles){
	vector<int> P = {1, 2, 4, 8, 16, 32};
	vector<int> I = {50, 33, 22, 15, 9, 7};
	vector<double> S = {0.4, 0.02, 0.01, 0.005, 0.0025, 0.00125};
	for (int cycle = 0; cycle < cycles && cycle < 6; cycle++){
		cout << "cycle: " << cycle << endl;
		for (auto &&e : edges){
			e.updatePoints(P[cycle]);
		}
		for (int i = 0; i < I[cycle]; i++){
			cout << "iteration: " << i + 1 << "/"<< I[cycle] << endl;
			// vector<vector<double>> Fp;
			vector<vector<point>> directions;
			for (int p = 0; p < edges.size(); p++){
				// Fp.push_back(vector<double>(P[cycle], 0));
				directions.push_back(vector<point>(P[cycle], point(0, 0)));
				for (int q = 0; q < edges.size(); q++){
					for (int j = 0; j < P[cycle]; j++){
						if (p == q) continue;
						double compatibility = Ce(edges[p], edges[q], j);
						if (compatibility < 0.05) continue;
						// Fp[p][j] +=.push_back(compatibility);
						point dir = edges[q].points[j] - edges[p].points[j];
						dir = dir.normalized() * compatibility;
						directions[p][j] += dir;
					}					
				}
			}
			for (int p = 0; p < edges.size(); p++){
				edges[p].movePoints(directions[p], S[cycle]);
			}
		}
		
	}
}

int main(){
	ifstream in("airlines.graphml");
	double minX = 10000, minY = 10000, maxX = -10000, maxY = -10000;
	if (in.is_open()){
		string line;
		while (getline(in, line)){
			if (line == "    <!-- nodes -->\r"){
				getline(in, line);
				while (line != "\r"){
					int id;
					double x = 0, y = 0;
					string tooltip(100, ' ');
					sscanf(line.c_str(), "    <node id=\"%d\">", &id);
					getline(in, line);
					sscanf(line.c_str(), "      <data key=\"x\">%lf</data>", &x);
					getline(in, line);
					sscanf(line.c_str(), "      <data key=\"tooltip\">%s %*u</data>", tooltip.data());
					getline(in, line);
					sscanf(line.c_str(), "      <data key=\"y\">%lf</data>", &y);
					// cout << x << " " << y << " " << tooltip.c_str() << endl;
					nodes.push_back(node(id, x, y, tooltip));
					if (minX > x) minX = x;
					if (maxX < x) maxX = x;
					if (minY > y) minY = y;
					if (maxY < y) maxY = y;
					getline(in, line);
					getline(in, line);
				}
			}
			if (line == "    <!-- edges -->\r"){
				getline(in, line);
				while (line != "  </graph>\r"){
					int id, source, target;
					sscanf(line.c_str(), "    <edge id=\"%d\" source=\"%d\" target=\"%d\">", &id, &source, &target);
					// cout << id << " " << source << " " << target << endl;
					edges.push_back(edge(id, source, target));
					getline(in, line);
					getline(in, line);
				}
			}
			
    	}
		in.close();
	} else {
		cout << "Unable to open file" << endl;
		return 404;
	}

	//TODO iterace
	iterate(6);
	// for (auto &&e : edges){
	// 	e.updatePoints(32);
	// }


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
	for (int i = 0; i < 10; i++){
		for (point p : edges[i].points){
			int xCoord = p.x + xShift, yCoord = p.y + yShift;
			for (int y = -1; y < 2; y++){
				for (int x = -1; x < 2; x++){
					img[coord(xCoord + x, yCoord + y, 0, width)] = 0;
					img[coord(xCoord + x, yCoord + y, 1, width)] = 0;
					img[coord(xCoord + x, yCoord + y, 2, width)] = 255;
				}
			}
		}
	}
	
	
	for (node n : nodes){
		int xCoord = n.x + xShift, yCoord = n.y + yShift;
		for (int y = -1; y < 2; y++){
			for (int x = -1; x < 2; x++){
				img[coord(xCoord + x, yCoord + y, 1, width)] = 0;
				img[coord(xCoord + x, yCoord + y, 2, width)] = 0;
			}
		}
	}
	
	stbi_write_png("image.png", width, height, 3, img, 0);

	stbi_image_free(img);

}