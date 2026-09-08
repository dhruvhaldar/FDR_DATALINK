import unittest
from pathlib import Path

from scripts.generate_static_data import convert, trim_trailing_zeros


SAMPLE = Path('Tail_666_9/666200402040817.mat')


class ExtractDataTests(unittest.TestCase):
    def test_extract_data_returns_expected_keys(self):
        result = convert(SAMPLE)
        for key in ['ALT', 'CAS', 'PTCH', 'ROLL', 'VRTG']:
            self.assertIn(key, result)
            self.assertIn('data', result[key])
            self.assertGreater(len(result[key]['data']), 0)

    def test_trimmed_trailing_zeros_for_flight_parameters(self):
        # Regression: CAS/PTCH/ROLL used to display as 0.0 because the source
        # arrays include long trailing zero-padding segments.
        result = convert(SAMPLE)

        self.assertNotEqual(result['CAS']['data'][-1], 0.0)
        self.assertNotEqual(result['PTCH']['data'][-1], 0.0)
        self.assertNotEqual(result['ROLL']['data'][-1], 0.0)

    def test_all_zero_series_is_preserved(self):
        # Some segments can legitimately be all-zero (e.g., parked data).
        # Ensure we don't trim everything away.
        values = [0.0, 0.0, 0.0]
        trimmed = trim_trailing_zeros(values)
        self.assertEqual(trimmed, values)


if __name__ == '__main__':
    unittest.main()
