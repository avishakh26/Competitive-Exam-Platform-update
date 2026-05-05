#include <bits/stdc++.h>
using namespace std;

void solve(int x, int y) {
    if (y == 0 || (x == 0 && y % 2 == 0) || x > y) {
        cout << "NO\n";
        return;
    }

    int n = x + y;
    cout << "YES\n";

    if (x == 0) {
        for (int i = 2; i <= y; i++)
            cout << "1 " << i << "\n";
        return;
    }

    if (n % 2 == 1) {
        int spine = 2 * x + 1;
        for (int i = 1; i < spine; i++)
            cout << i << " " << i + 1 << "\n";
        for (int j = 0; j < y - x - 1; j++)
            cout << spine << " " << spine + 1 + j << "\n";
    } else {
        int spine = 2 * x;
        for (int i = 1; i < spine; i++)
            cout << i << " " << i + 1 << "\n";
        for (int j = 0; j < y - x; j++)
            cout << spine << " " << spine + 1 + j << "\n";
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int t;
    cin >> t;
    int add_x = (t == 2) ? 1 : 0;

    while (t--) {
        int x, y;
        cin >> x >> y;
        x += add_x;
        solve(x, y);
    }

    return 0;
}
