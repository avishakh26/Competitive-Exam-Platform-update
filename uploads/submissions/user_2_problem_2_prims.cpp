#include <iostream>
#include <vector>
#include <queue>
#include <climits>

using namespace std;

int primMST(int v, vector<vector<pair<int, int>>> &adj) {
    vector<bool> inMST(v, false);
    vector<int> parent(v, -1);
    vector<int> key(v, INT_MAX);   // NEW

    priority_queue<
        pair<int, int>,
        vector<pair<int, int>>,
        greater<pair<int, int>>
    > pq;

    key[0] = 0;
    pq.push({0, 0});

    int mstcost = 0;

    while (!pq.empty()) {
        auto p = pq.top();
        pq.pop();

        int u = p.second;

        if (inMST[u]) continue;

        inMST[u] = true;
        mstcost += p.first;

        if (parent[u] != -1) {
            cout << char(parent[u] + 'A') << " - "
                 << char(u + 'A') << " -> " << p.first << endl;
        }

        for (auto edge : adj[u]) {
            int v = edge.first;
            int w = edge.second;

            if (!inMST[v] && w < key[v]) {
                key[v] = w;
                parent[v] = u;
                pq.push({w, v});
            }
        }
    }

    return mstcost;
}

// Add edge
void addEdge(vector<vector<pair<int, int>>> &adj, int u, int v, int w) {
    adj[u].push_back({v, w});
    adj[v].push_back({u, w});
}

// Build Example Graph
void buildExampleGraph(vector<vector<pair<int, int>>> &adj) {

    addEdge(adj, 0, 1, 2);  // A-B
    addEdge(adj, 0, 3, 3);  // A-D
    addEdge(adj, 1, 2, 1);  // B-C
    addEdge(adj, 2, 3, 2);  // C-D
    addEdge(adj, 2, 4, 5);  // C-E
    addEdge(adj, 3, 4, 4);  // D-E

}

int main() {

    int v = 5;
    vector<vector<pair<int, int>>> adj(v);

    buildExampleGraph(adj);

    cout << "MST Edges:\n";
    int cost = primMST(v, adj);

    cout << "Total MST Cost = " << cost << endl;

    return 0;
}