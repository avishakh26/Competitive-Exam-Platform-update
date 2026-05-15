#include <iostream>
#include <vector>
#include <algorithm>
#include <iomanip>

using namespace std;

int main() {
    int n, W;

    cout << "Enter the number of items: ";
    cin >> n;

    if (n <= 0) {
        cerr << "Invalid number of items." << endl;
        return 1;
    }

    vector<int> val(n + 1);
    vector<int> wt(n + 1);

    for (int i = 1; i <= n; ++i) {
        cout << "Item " << i << ":" << endl;
        cout << "  Value: ";
        cin >> val[i];
        cout << "  Weight: ";
        cin >> wt[i];
    }

    cout << "Enter knapsack capacity: ";
    cin >> W;

    if (W < 0) {
        cerr << "Invalid knapsack capacity." << endl;
        return 1;
    }

    vector<vector<int>> K(n + 1, vector<int>(W + 1, 0));

    for (int i = 1; i <= n; ++i) {
        for (int w = 1; w <= W; ++w) {
            if (wt[i] <= w) {
                K[i][w] = max(val[i] + K[i - 1][w - wt[i]], K[i - 1][w]);
            } else {
                K[i][w] = K[i - 1][w];
            }
        }
    }

    int col_width = 8;

    cout << "\n\n   w ->";
    for (int w = 0; w <= W; ++w) {
        cout << setw(col_width) << w << " ";
    }
    cout << endl;

    cout << "i" << endl;
    cout << "↓" << endl;

    for (int i = 0; i <= n; ++i) {
        cout << i << "        [";
        for (int w = 0; w <= W; ++w) {
            cout << K[i][w];

            if (w < W) {
                cout << ",";

                int num_digits = to_string(K[i][w]).length();

                for (int p = 0; p < (col_width - num_digits - 1); ++p) {
                    cout << " ";
                }
            }
        }
        cout << "]" << endl;
    }

    cout << "\nTotal Value (Max profit) = " << K[n][W] << endl;

    return 0;
}