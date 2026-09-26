import unittest

from app.chunking import chunk_text


class ChunkingTests(unittest.TestCase):
    def test_empty_text(self):
        self.assertEqual(chunk_text("   "), [])

    def test_preserves_content(self):
        text = "First paragraph.\n\nSecond paragraph with useful information."
        chunks = chunk_text(text, target_size=200, overlap=20)
        joined = " ".join(c.text for c in chunks)
        self.assertIn("First paragraph.", joined)
        self.assertIn("Second paragraph", joined)

    def test_long_text_is_bounded(self):
        text = "x" * 5000
        chunks = chunk_text(text, target_size=500, overlap=50)
        self.assertGreater(len(chunks), 1)
        self.assertTrue(all(len(c.text) <= 553 for c in chunks))


if __name__ == "__main__":
    unittest.main()
