#include<bits/stdc++.h>
using namespace std;

int main(){
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int t;
    cin >> t;

    vector<int> ns(t);
    for(int i = 0; i < t; i++) cin >> ns[i];

    for(int i = 0; i < t; i++){
        int n = ns[i];
        for(int j = 1; j <= n; j++){
            cout << j << " " << n + 2*j - 1 << " " << n + 2*j;
            if(j < n) cout << " ";
        }
        cout << "\n";
    }
    return 0;
}
