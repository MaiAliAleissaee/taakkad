"""Live anonymous boundary tests: no writes or AI calls are performed."""
import unittest
from pathlib import Path
import requests


class PublicWorkspaceBoundaries(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        config = {}
        for line in Path('.env').read_text().splitlines():
            if '=' in line and not line.startswith('#'):
                name, value = line.split('=', 1)
                config[name.strip()] = value.strip().strip('"').strip("'")
        cls.url = config['VITE_SUPABASE_URL'] + '/rest/v1/rpc/'
        cls.headers = {'apikey': config['VITE_SUPABASE_PUBLISHABLE_KEY'], 'Content-Type': 'application/json'}

    def denied(self, function, args):
        response = requests.post(self.url + function, headers=self.headers,
            json={**args, 'workspace_user': '00000000-0000-0000-0000-000000000001'}, timeout=20)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json().get('code'), '42501')
        self.assertEqual(response.json().get('message'), 'Workspace access denied')

    def test_private_message_indicators_denied(self):
        self.denied('flagged_message_values', {'candidate_values': ['203.0.113.45']})

    def test_private_ai_indicators_denied(self):
        self.denied('flagged_ai_indicator_values', {'candidate_indicators': [{'type': 'ip', 'value': '203.0.113.45'}]})

    def test_arbitrary_message_recipient_denied(self):
        self.denied('submit_security_report', {'report_input': {'channel': 'email', 'sender': 'boundary-test.example', 'body': 'fictional security boundary test'}})

    def test_arbitrary_ai_recipient_denied(self):
        self.denied('submit_ai_security_report', {'report_input': {'channel': 'email', 'sender': 'boundary-test.example', 'body': 'fictional security boundary test'}})

    def test_public_synthetic_reference_preserved(self):
        response = requests.post(self.url + 'flagged_message_values', headers=self.headers, json={'candidate_values': ['203.0.113.45']}, timeout=20)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), ['203.0.113.45'])

    def test_public_typed_reference_preserved(self):
        response = requests.post(self.url + 'flagged_ai_indicator_values', headers=self.headers, json={'candidate_indicators': [{'type': 'ip', 'value': '203.0.113.45'}]}, timeout=20)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), ['203.0.113.45'])

    def test_wrong_indicator_type_does_not_match(self):
        response = requests.post(self.url + 'flagged_ai_indicator_values', headers=self.headers, json={'candidate_indicators': [{'type': 'phone', 'value': '203.0.113.45'}]}, timeout=20)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])


if __name__ == '__main__':
    unittest.main()