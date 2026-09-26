import unittest

from pydantic import ValidationError
from app.schemas import AskRequest


class SchemaTests(unittest.TestCase):
    def test_question_rejects_blank(self):
        with self.assertRaises(ValidationError):
            AskRequest(question="   ")


if __name__ == "__main__":
    unittest.main()
