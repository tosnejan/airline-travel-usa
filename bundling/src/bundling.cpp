#include <iostream>
#include <fstream>
#include <vector>
#include <set>
#include <string>
#include <cmath>

#include "utils.hpp"
#include "models.hpp"

using namespace std;

set<int>* foundEdges;

int P[] = {1, 3, 7, 15, 31, 63};
int I[] = {50, 33, 22, 15, 9, 7};
double S[] = {0.04, 0.02, 0.01, 0.005, 0.0025, 0.00125};

double Ca(Edge &p, Edge &q){
	return abs((p.dir.x * q.dir.x + p.dir.y * q.dir.y) / (p.dir.length * q.dir.length));
}

double Cs(Edge &p, Edge &q){
	return pow(1 - (abs(p.length - q.length) / (p.length + q.length)), 2);
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
	/* double ca = Ca(p, q), cs = Cs(p,q), cp = Cp(p,q), cv = Cv(p,q);
	double ret = ca*cs*cp*cv;
	cout << "Ca: " << ca << ", Cs: " << cs << ", Cp: " << cp << ", Cv: " << cv << ", ret: " << ret << endl; */
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
			#pragma omp parallel for
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
						if(abs(dir.x) < 0.01 && abs(dir.y) < 0.01){
							continue;
						}
						// Direction between subpoints but normalized and scaled by compatibility.
						edges[p].directions[j] += dir * (compatibility / (dir.length* dir.length));
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

int main(int argc, char**argv){
	set<int>* foundEdges = new set<int>[nodes.size()];
	ifstream in("airlines.graphml");
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
					// cout << "1) " <<x*0.1 << " " << y*(-0.1) << " " << tooltip.c_str() << endl;
					Point p = conformalConicProjection(x*0.1, y*(-0.1));
					nodes.push_back(Node(id, p.x, p.y, tooltip));
					// cout << "2) " << p.x << " " << p.y << " " << tooltip.c_str() << endl;
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
					edges.push_back(Edge(edgeCounter++, source, target));
					// Edges are sorted by source
					/* if(foundEdges[source].find(target) == foundEdges[source].end() && 
							foundEdges[target].find(source) == foundEdges[target].end()) {
						edges.push_back(Edge(edgeCounter++, source, target));
						foundEdges[target].insert(source);
					} */
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

	int iterations = 5;

	if(argc > 1) {
		iterations = atoi(argv[1]);
		iterations = max(1,min(6, iterations));
	}

	double sigma = 0;

	if(argc > 2) {
		sigma = atof(argv[2]);
		if(sigma > 0)
			sigma = P[iterations-1] * 0.25 * max(0.0,min(1.0, sigma));
	}

	iterate(iterations);

	cout << "Iterations: " << iterations << endl;
	cout << "Gaussian smoothing sigma: " << sigma << endl;

	if(sigma > 0){
		vector<double> kernel = gauss_kernel_1d(sigma);
		int kernelSize = kernel.size();
		cout << kernelSize << endl;
		int center = kernelSize / 2;
		for(Edge &e: edges){
			int pointsNum = e.points.size();
			vector<Point> gaussed;
			gaussed.push_back(e.points[0]);
			for(int i = 1; i < pointsNum - 1; i++){
				Point insert;
				for (int u = -center; u <= center; u++)
				{
					int x = i + u;
					x = x < 0 ? 0 : x;
					x = x >= pointsNum ? pointsNum-1 : x;
					insert += e.points[x] * kernel[center + u];
				}
				gaussed.push_back(insert);
			}
			gaussed.push_back(e.points[pointsNum-1]);
			e.points = gaussed;
		}
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
		Point inverse = inverseConformalConicProjection(n.x, n.y);
		outputFile << "\"pos\": [" << inverse.x << ", "  << inverse.y <<"]";
		outputFile << "}" << (nodes.size() - 1 != n.id ? "," : "") << "\n";
	}
	outputFile << "], \n";
	outputFile << "\"edges\": [\n";
	for (Edge &e : edges){
		outputFile << "{ ";
		outputFile << "\"id\": " << e.id << ", ";
		outputFile << "\"s\": " << e.from << ", ";
		outputFile << "\"t\": " << e.to << ", ";
		outputFile << "\"line\": ["; 
		for(int i = 0; i < (int)e.points.size(); i++){
			Point inverse = inverseConformalConicProjection(e.points[i].x, e.points[i].y);
			outputFile << "[" << inverse.x << ", "  << inverse.y <<"]";
			outputFile << (e.points.size() - 1 != i ? ", " : "");
		}
		outputFile << "]";
		outputFile << "}" << (edges.size() - 1 != e.id ? "," : "") << "\n";
	}
	outputFile << "]\n";
	// JSON end
	outputFile << "}\n";
	outputFile.close();
}