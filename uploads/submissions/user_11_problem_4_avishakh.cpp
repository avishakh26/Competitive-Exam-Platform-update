#include <iostream>
using namespace std;

class ATM {
private:
    int pin;
    double balance;

public:

    ATM() {
        pin = 1234;        
        balance = 1000.0;  
    }


    bool verifyPin(int enteredPin) {
        return enteredPin == pin;
    }


    void checkBalance() {
        cout << "Current Balance: $" << balance << endl;
    }


    void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
            cout << "Deposit successful!\n";
        } else {
            cout << "Invalid deposit amount!\n";
        }
    }

   
    void withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
            cout << "Please collect your cash.\n";
        } else {
            cout << "Insufficient balance or invalid amount!\n";
        }
    }
};

int main() {
    ATM user;
    int enteredPin;
    int choice;
    double amount;

    cout << " Welcome to ATM \n";
    cout << "Enter your PIN: ";
    cin >> enteredPin;

    if (!user.verifyPin(enteredPin)) {
        cout << "Incorrect PIN! Access Denied.\n";
        return 0;
    }

    do {
        cout << "\n ATM Menu \n";
        cout << "1. Check Balance\n";
        cout << "2. Deposit Money\n";
        cout << "3. Withdraw Money\n";
        cout << "4. Exit\n";
        cout << "Enter your choice: ";
        cin >> choice;

        switch (choice) {
        case 1:
            user.checkBalance();
            break;

        case 2:
            cout << "Enter amount to deposit: ";
            cin >> amount;
            user.deposit(amount);
            break;

        case 3:
            cout << "Enter amount to withdraw: ";
            cin >> amount;
            user.withdraw(amount);
            break;

        case 4:
            cout << "Thank you for using ATM!\n";
            break;

        default:
            cout << "Invalid choice! Try again.\n";
        }

    } while (choice != 4);

    return 0;
}

