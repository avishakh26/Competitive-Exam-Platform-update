#include <bits/stdc++.h>
using namespace std;

const int MOD = 676767677;

int main(){
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int T;
    cin >> T;
    while(T--) {
        int n, m;
        cin >> n >> m;
        vector<int> b(n);
        for(int i = 0; i < n; i++) cin >> b[i];

        vector<int> freq(m, 0);
        for(int i = 0; i < n; i++) freq[b[i]]++;
        vector<int> cnt(m+1, 0);
        for(int t = 1; t <= m; t++) cnt[t] = cnt[t-1] + freq[t-1];

        long long ans = 1;
        bool valid = true;

        for(int i = 0; i < n; i++) {
            int t = b[i];
            if(t == 0) continue;

            int L = INT_MAX;
            if(i > 0 && b[i-1] < t) L = min(L, b[i-1]);
            if(i < n-1 && b[i+1] < t) L = min(L, b[i+1]);

            if(L == INT_MAX) { valid = false; break; }

            long long choices;
            if(t == L + 1) {
                choices = cnt[t];
            } else {
                choices = cnt[t] - cnt[t-1];
            }

            if(choices <= 0) { valid = false; break; }
            ans = (ans * (choices % MOD)) % MOD;
        }

        cout << (valid ? ans : 0) << "\n";
    }
    return 0;
}
