#include <iostream>
#include <vector>
#include <queue>
#include <climits>
#include <bits/stdc++.h>
using namespace std;

#define INF 1e9

void addEdge(vector<vector<pair<int,int>>> &adj, int u, int v, int w) {
    adj[u].push_back({v, w});
    adj[v].push_back({u, w});
}

int main() {
    int V = 5;
    vector<vector<pair<int,int>>> adj(V);

    addEdge(adj, 0, 1, 2); // A-B
    addEdge(adj, 0, 3, 3); // A-D
    addEdge(adj, 1, 2, 1); // B-C
    addEdge(adj, 2, 3, 2); // C-D
    addEdge(adj, 2, 4, 5); // C-E
    addEdge(adj, 3, 4, 4); // A-B


    vector<int> dist(V, INF), parent(V, -1);

    priority_queue<pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>>> pq;

    int src = 0;
    dist[src] = 0;
    pq.push({0, src});

    while (!pq.empty()) {
        int u = pq.top().second;
        int d = pq.top().first;
        pq.pop();

        if (d > dist[u]) continue;

        for (auto e : adj[u]) {
            int v = e.first;
            int w = e.second;

            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                parent[v] = u;
                pq.push({dist[v], v});
            }
        }
    }

    cout << "S  to  D    Minimum cost   Shortest Path\n";

    for (int i = 0; i < V; i++) {
        cout << "A  ->  " << char('A' + i) << "          "
             << dist[i] << "           ";

        vector<char> path;
        int t = i;
        while (t != -1) {
            path.push_back('A' + t);
            t = parent[t];
        }
        reverse(path.begin(), path.end());

        for (int j = 0; j < path.size(); j++) {
            cout << path[j];
            if (j != path.size() - 1) cout << " - ";
        }
        cout << endl;
    }

    return 0;
}