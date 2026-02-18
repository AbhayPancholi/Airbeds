import requests
import json
import sys
from datetime import datetime, timedelta
import uuid

class PropertyManagementAPITester:
    def __init__(self, base_url="https://rental-broker-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'owners': [],
            'tenants': [],
            'agreements': [],
            'payments': [],
            'expenses': [],
            'notices': [],
            'police_verifications': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.content:
                    try:
                        return response.json()
                    except:
                        return {}
                return {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return {}

    def test_auth_registration(self):
        """Test admin registration"""
        test_email = f"admin_{datetime.now().strftime('%H%M%S')}@test.com"
        data = {
            "name": "Test Admin",
            "email": test_email,
            "password": "TestPass123!"
        }
        
        result = self.run_test(
            "Admin Registration",
            "POST",
            "auth/register",
            200,
            data=data,
            auth_required=False
        )
        
        if result and 'access_token' in result:
            self.token = result['access_token']
            self.admin_id = result['admin']['id']
            print(f"   ✓ Token received: {self.token[:20]}...")
            return True
        return False

    def test_auth_login(self):
        """Test admin login with registered credentials"""
        # Use the same credentials from registration
        test_email = f"admin_{datetime.now().strftime('%H%M%S')}@test.com"
        data = {
            "email": test_email,
            "password": "TestPass123!"
        }
        
        result = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=data,
            auth_required=False
        )
        
        if result and 'access_token' in result:
            self.token = result['access_token']
            print(f"   ✓ Login successful")
            return True
        return False

    def test_dashboard_stats(self):
        """Test dashboard statistics API"""
        result = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        
        if result:
            print(f"   ✓ Stats retrieved: {len(result)} fields")
            return True
        return False

    def test_create_owner(self):
        """Test creating an owner"""
        data = {
            "name": "John Property Owner",
            "phone": "9876543210", 
            "email": "owner@test.com",
            "property_address": "123 Test Street, Test City",
            "flat_number": "A101"
        }
        
        result = self.run_test(
            "Create Owner",
            "POST",
            "owners",
            200,
            data=data
        )
        
        if result and 'id' in result:
            self.created_ids['owners'].append(result['id'])
            print(f"   ✓ Owner created with ID: {result['id']}")
            return result['id']
        return None

    def test_get_owners(self):
        """Test getting owners list"""
        result = self.run_test(
            "Get Owners List",
            "GET",
            "owners",
            200
        )
        
        if isinstance(result, list):
            print(f"   ✓ Retrieved {len(result)} owners")
            return True
        return False

    def test_create_tenant(self, owner_id):
        """Test creating a tenant"""
        data = {
            "room_number": "101",
            "tenant_name": "Jane Doe",
            "father_name": "John Doe Sr",
            "dob": "1990-01-15",
            "gender": "female",
            "occupation": "Software Engineer", 
            "permanent_address": "456 Tenant Street, Tenant City",
            "aadhaar_number": "123456789012",
            "contact_number": "9876543211",
            "email": "tenant@test.com",
            "joining_date": "2024-01-01",
            "deposit_amount": 50000,
            "monthly_rent": 25000,
            "owner_id": owner_id
        }
        
        result = self.run_test(
            "Create Tenant",
            "POST",
            "tenants",
            200,
            data=data
        )
        
        if result and 'id' in result:
            self.created_ids['tenants'].append(result['id'])
            print(f"   ✓ Tenant created with ID: {result['id']}")
            return result['id']
        return None

    def test_get_tenants(self):
        """Test getting tenants list"""
        result = self.run_test(
            "Get Tenants List",
            "GET",
            "tenants",
            200
        )
        
        if isinstance(result, list):
            print(f"   ✓ Retrieved {len(result)} tenants")
            return True
        return False

    def test_create_agreement(self, tenant_id, owner_id):
        """Test creating an agreement"""
        today = datetime.now().date()
        end_date = today + timedelta(days=365)
        
        data = {
            "tenant_id": tenant_id,
            "owner_id": owner_id,
            "start_date": today.isoformat(),
            "end_date": end_date.isoformat(),
            "rent_amount": 25000,
            "deposit_amount": 50000
        }
        
        result = self.run_test(
            "Create Agreement",
            "POST",
            "agreements",
            200,
            data=data
        )
        
        if result and 'id' in result:
            self.created_ids['agreements'].append(result['id'])
            print(f"   ✓ Agreement created with ID: {result['id']}")
            return result['id']
        return None

    def test_create_payment(self, owner_id):
        """Test creating a payment record"""
        data = {
            "owner_id": owner_id,
            "month": "2024-08",
            "amount_paid": 25000,
            "payment_date": "2024-08-01",
            "notes": "Test payment"
        }
        
        result = self.run_test(
            "Create Payment",
            "POST",
            "payments",
            200,
            data=data
        )
        
        if result and 'id' in result:
            self.created_ids['payments'].append(result['id'])
            print(f"   ✓ Payment created with ID: {result['id']}")
            return result['id']
        return None

    def test_create_expense(self):
        """Test creating an expense record"""
        data = {
            "expense_type": "Maintenance",
            "amount": 5000,
            "date": "2024-08-15",
            "description": "Monthly building maintenance"
        }
        
        result = self.run_test(
            "Create Expense", 
            "POST",
            "expenses",
            200,
            data=data
        )
        
        if result and 'id' in result:
            self.created_ids['expenses'].append(result['id'])
            print(f"   ✓ Expense created with ID: {result['id']}")
            return result['id']
        return None

    def test_create_notice(self, tenant_id):
        """Test creating a leave notice"""
        data = {
            "tenant_id": tenant_id,
            "notice_date": "2024-08-01", 
            "leaving_date": "2024-09-01",
            "reason": "Job relocation"
        }
        
        result = self.run_test(
            "Create Notice",
            "POST", 
            "notices",
            200,
            data=data
        )
        
        if result and 'id' in result:
            self.created_ids['notices'].append(result['id'])
            print(f"   ✓ Notice created with ID: {result['id']}")
            return result['id']
        return None

    def test_create_police_verification(self, tenant_id):
        """Test creating a police verification"""
        data = {
            "tenant_id": tenant_id,
            "employer_details": "ABC Tech Company, Sector 5, Test City",
            "local_address": "Same as permanent address", 
            "emergency_contact": "9876543999"
        }
        
        result = self.run_test(
            "Create Police Verification",
            "POST",
            "police-verifications", 
            200,
            data=data
        )
        
        if result and 'id' in result:
            self.created_ids['police_verifications'].append(result['id'])
            print(f"   ✓ Police verification created with ID: {result['id']}")
            return result['id']
        return None

    def test_get_all_endpoints(self):
        """Test all GET endpoints"""
        endpoints = [
            ("agreements", "Get Agreements"),
            ("payments", "Get Payments"), 
            ("expenses", "Get Expenses"),
            ("notices", "Get Notices"),
            ("police-verifications", "Get Police Verifications")
        ]
        
        for endpoint, name in endpoints:
            result = self.run_test(name, "GET", endpoint, 200)
            if isinstance(result, list):
                print(f"   ✓ Retrieved {len(result)} {endpoint}")

def main():
    print("🏢 Property Management System API Testing")
    print("=" * 50)
    
    tester = PropertyManagementAPITester()
    
    # Test authentication first
    if not tester.test_auth_registration():
        print("\n❌ Registration failed, stopping tests")
        return 1
        
    # Test dashboard (requires auth)
    tester.test_dashboard_stats()
    
    # Test owners CRUD
    owner_id = tester.test_create_owner()
    if not owner_id:
        print("\n❌ Owner creation failed, stopping dependent tests") 
        return 1
        
    tester.test_get_owners()
    
    # Test tenants CRUD  
    tenant_id = tester.test_create_tenant(owner_id)
    if not tenant_id:
        print("\n❌ Tenant creation failed, stopping dependent tests")
        return 1
        
    tester.test_get_tenants()
    
    # Test other entities that depend on owners/tenants
    tester.test_create_agreement(tenant_id, owner_id)
    tester.test_create_payment(owner_id)
    tester.test_create_expense()
    tester.test_create_notice(tenant_id)
    tester.test_create_police_verification(tenant_id)
    
    # Test all GET endpoints
    tester.test_get_all_endpoints()
    
    # Print final results
    print(f"\n📊 Test Results:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    # Show created test data
    print(f"\n📝 Created Test Data:")
    for entity, ids in tester.created_ids.items():
        if ids:
            print(f"   {entity.title()}: {len(ids)} records")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())