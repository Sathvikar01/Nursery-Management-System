import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class NurseryAPITester:
    def __init__(self, base_url="https://plant-manager.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_user = None
        self.test_data = {}

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_init_admin(self):
        """Test admin initialization"""
        success, response = self.run_test(
            "Initialize Admin",
            "POST",
            "init-admin",
            200
        )
        return success

    def test_login(self, username="admin", password="admin123"):
        """Test login and get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.admin_user = response['user']
            print(f"   Logged in as: {self.admin_user['full_name']} ({self.admin_user['role']})")
            return True
        return False

    def test_auth_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_customer(self):
        """Test creating a customer"""
        customer_data = {
            "name": "Test Customer",
            "phone": "9876543210",
            "email": "test@customer.com",
            "address": "123 Test Street, Test City"
        }
        
        success, response = self.run_test(
            "Create Customer",
            "POST",
            "customers",
            200,
            data=customer_data
        )
        
        if success:
            self.test_data['customer'] = response
            print(f"   Created customer: {response['name']} (ID: {response['id']})")
        return success

    def test_get_customers(self):
        """Test getting customers list"""
        success, response = self.run_test(
            "Get Customers",
            "GET",
            "customers",
            200
        )
        if success:
            print(f"   Found {len(response)} customers")
        return success

    def test_search_customers(self):
        """Test customer search"""
        success, response = self.run_test(
            "Search Customers",
            "GET",
            "customers/search?q=Test",
            200
        )
        if success:
            print(f"   Search returned {len(response)} customers")
        return success

    def test_create_plant(self):
        """Test creating a plant"""
        plant_data = {
            "name": "Rose Plant",
            "category": "Flowering",
            "variants": ["Red", "White", "Pink"],
            "current_stock": 50,
            "min_stock_threshold": 10,
            "cost_price": 25.0,
            "selling_price": 50.0,
            "investment": 1250.0,
            "location": "Section A-1",
            "description": "Beautiful flowering rose plant"
        }
        
        success, response = self.run_test(
            "Create Plant",
            "POST",
            "plants",
            200,
            data=plant_data
        )
        
        if success:
            self.test_data['plant'] = response
            print(f"   Created plant: {response['name']} (ID: {response['id']})")
        return success

    def test_get_plants(self):
        """Test getting plants list"""
        success, response = self.run_test(
            "Get Plants",
            "GET",
            "plants",
            200
        )
        if success:
            print(f"   Found {len(response)} plants")
        return success

    def test_get_plant_by_id(self):
        """Test getting a specific plant"""
        if 'plant' not in self.test_data:
            print("❌ Skipping - No plant created yet")
            return False
            
        plant_id = self.test_data['plant']['id']
        success, response = self.run_test(
            "Get Plant by ID",
            "GET",
            f"plants/{plant_id}",
            200
        )
        return success

    def test_get_low_stock_plants(self):
        """Test getting low stock plants"""
        success, response = self.run_test(
            "Get Low Stock Plants",
            "GET",
            "plants/low-stock",
            200
        )
        if success:
            print(f"   Found {len(response)} low stock plants")
        return success

    def test_create_bill(self):
        """Test creating a bill"""
        if 'customer' not in self.test_data or 'plant' not in self.test_data:
            print("❌ Skipping - Need customer and plant data")
            return False
            
        bill_data = {
            "customer_id": self.test_data['customer']['id'],
            "items": [
                {
                    "plant_id": self.test_data['plant']['id'],
                    "plant_name": self.test_data['plant']['name'],
                    "variant": "Red",
                    "quantity": 2,
                    "unit_price": 50.0,
                    "total_price": 100.0
                }
            ],
            "tax": 18.0,
            "discount": 10.0,
            "payment_method": "cash"
        }
        
        success, response = self.run_test(
            "Create Bill",
            "POST",
            "bills",
            200,
            data=bill_data
        )
        
        if success:
            self.test_data['bill'] = response
            print(f"   Created bill: {response['bill_number']} (Total: ₹{response['total_amount']})")
        return success

    def test_get_bills(self):
        """Test getting bills list"""
        success, response = self.run_test(
            "Get Bills",
            "GET",
            "bills",
            200
        )
        if success:
            print(f"   Found {len(response)} bills")
        return success

    def test_get_pending_bills(self):
        """Test getting pending bills"""
        success, response = self.run_test(
            "Get Pending Bills",
            "GET",
            "bills/pending",
            200
        )
        if success:
            print(f"   Found {len(response)} pending bills")
        return success

    def test_approve_bill(self):
        """Test approving a bill"""
        if 'bill' not in self.test_data:
            print("❌ Skipping - No bill created yet")
            return False
            
        bill_id = self.test_data['bill']['id']
        success, response = self.run_test(
            "Approve Bill",
            "PUT",
            f"bills/{bill_id}/approve",
            200
        )
        return success

    def test_create_quotation(self):
        """Test creating a quotation"""
        if 'customer' not in self.test_data or 'plant' not in self.test_data:
            print("❌ Skipping - Need customer and plant data")
            return False
            
        quotation_data = {
            "customer_id": self.test_data['customer']['id'],
            "items": [
                {
                    "plant_id": self.test_data['plant']['id'],
                    "plant_name": self.test_data['plant']['name'],
                    "variant": "White",
                    "quantity": 5,
                    "unit_price": 50.0,
                    "total_price": 250.0
                }
            ],
            "tax": 45.0,
            "discount": 25.0,
            "valid_days": 30
        }
        
        success, response = self.run_test(
            "Create Quotation",
            "POST",
            "quotations",
            200,
            data=quotation_data
        )
        
        if success:
            self.test_data['quotation'] = response
            print(f"   Created quotation: {response['quotation_number']} (Total: ₹{response['total_amount']})")
        return success

    def test_get_quotations(self):
        """Test getting quotations list"""
        success, response = self.run_test(
            "Get Quotations",
            "GET",
            "quotations",
            200
        )
        if success:
            print(f"   Found {len(response)} quotations")
        return success

    def test_dashboard_analytics(self):
        """Test dashboard analytics"""
        success, response = self.run_test(
            "Get Dashboard Analytics",
            "GET",
            "analytics/dashboard",
            200
        )
        if success:
            print(f"   Total Sales: ₹{response.get('total_sales', 0)}")
            print(f"   Total Plants: {response.get('total_plants', 0)}")
            print(f"   Low Stock Alerts: {response.get('low_stock_alerts', 0)}")
            print(f"   Recent Bills: {len(response.get('recent_bills', []))}")
        return success

def main():
    print("🌱 Starting Shree Krishna Nursery Management System API Tests")
    print("=" * 60)
    
    tester = NurseryAPITester()
    
    # Phase 1: Authentication Tests
    print("\n📋 Phase 1: Authentication & Initialization")
    if not tester.test_init_admin():
        print("❌ Admin initialization failed")
    
    if not tester.test_login():
        print("❌ Login failed, stopping tests")
        return 1
    
    if not tester.test_auth_me():
        print("❌ Auth verification failed")
    
    # Phase 2: Customer Management Tests
    print("\n📋 Phase 2: Customer Management")
    tester.test_create_customer()
    tester.test_get_customers()
    tester.test_search_customers()
    
    # Phase 3: Plant Management Tests
    print("\n📋 Phase 3: Plant Management")
    tester.test_create_plant()
    tester.test_get_plants()
    tester.test_get_plant_by_id()
    tester.test_get_low_stock_plants()
    
    # Phase 4: Bill Management Tests
    print("\n📋 Phase 4: Bill Management")
    tester.test_create_bill()
    tester.test_get_bills()
    tester.test_get_pending_bills()
    tester.test_approve_bill()
    
    # Phase 5: Quotation Management Tests
    print("\n📋 Phase 5: Quotation Management")
    tester.test_create_quotation()
    tester.test_get_quotations()
    
    # Phase 6: Analytics Tests
    print("\n📋 Phase 6: Dashboard Analytics")
    tester.test_dashboard_analytics()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend API tests passed!")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed_tests} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())