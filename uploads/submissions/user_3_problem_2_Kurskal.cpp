#include <bits/stdc++.h>
using namespace std;

struct Edge {
    int u, v, w;
};

// Comparator for sorting edges by weight
bool cmp(Edge a, Edge b) {
    return a.w < b.w;
}

// Disjoint Set Union (DSU)
class DSU {
    vector<int> parent, rankv;

public:
    DSU(int n) {
        parent.resize(n);
        rankv.resize(n, 0);
        for (int i = 0; i < n; i++)
            parent[i] = i;
    }

    int Find(int x) {
        if (parent[x] != x)
            parent[x] = Find(parent[x]);
        return parent[x];
    }

    void Union(int x, int y) {
        int rx = Find(x);
        int ry = Find(y);

        if (rx == ry) return;

        if (rankv[rx] < rankv[ry])
            parent[rx] = ry;
        else if (rankv[rx] > rankv[ry])
            parent[ry] = rx;
        else {
            parent[ry] = rx;
            rankv[rx]++;
        }
    }
};

// Add edge helper
void addEdge(vector<Edge> &edges, int u, int v, int w) {
    edges.push_back({u, v, w});
}

// Build Example Graph (Static Input)
void buildExampleGraph(vector<Edge> &edges) {
    addEdge(edges, 0, 1, 2);  // A-B
    addEdge(edges, 0, 3, 3);  // A-D
    addEdge(edges, 1, 2, 1);  // B-C
    addEdge(edges, 2, 3, 2);  // C-D
    addEdge(edges, 2, 4, 5);  // C-E
    addEdge(edges, 3, 4, 4);  // D-E
}

int main() {

    int V = 5;   // A, B, C, D, E
    vector<Edge> edges;

    buildExampleGraph(edges);

    sort(edges.begin(), edges.end(), cmp);

    DSU dsu(V);

    int total_cost = 0;

    cout << "MST Edges:\n";

    for (auto &e : edges) {
        if (dsu.Find(e.u) != dsu.Find(e.v)) {
            dsu.Union(e.u, e.v);
            total_cost += e.w;

            cout << char('A' + e.u) << " - "
                 << char('A' + e.v) << " -> "
                 << e.w << endl;
        }
    }

    cout << "Total MST Cost = " << total_cost << endl;

    return 0;
}


