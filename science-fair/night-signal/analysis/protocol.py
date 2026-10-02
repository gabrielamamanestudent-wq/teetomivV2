"""
Night Signal - the device's line format, in one place.

The wearable sends two kinds of lines (see firmware/night_signal_esp32.ino):

  data    millis,heartRate,hrValid,spo2,spo2Valid[,ax,ay,az[,finger,battery]]
  status  #STATUS,fw=3.0,max30102=OK,mpu6050=OK,battery=84

Older firmware sends 5 or 8 fields; v3 sends 10. Missing fields get defaults,
so every version of the device works with every script.
"""

COLUMNS = ["timestamp", "device_ms", "heart_rate", "hr_valid", "spo2",
           "spo2_valid", "ax", "ay", "az", "finger", "battery"]


def parse_data(raw):
    """Return a dict for a data line, or None for headers, status lines and noise."""
    parts = raw.strip().split(",")
    if len(parts) not in (5, 8, 10):
        return None
    try:
        row = {
            "device_ms": int(parts[0]),
            "heart_rate": int(parts[1]),
            "hr_valid": int(parts[2]),
            "spo2": int(parts[3]),
            "spo2_valid": int(parts[4]),
            "ax": 0.0, "ay": 0.0, "az": 0.0,
            "finger": 1, "battery": -1,
        }
        if len(parts) >= 8:
            row["ax"], row["ay"], row["az"] = (float(p) for p in parts[5:8])
        if len(parts) == 10:
            row["finger"], row["battery"] = int(parts[8]), int(parts[9])
    except ValueError:
        return None          # the header line, or a garbled line
    return row


def parse_status(raw):
    """Return {'fw': '3.0', 'max30102': 'OK', ...} for a #STATUS line, else None."""
    raw = raw.strip()
    if not raw.startswith("#STATUS"):
        return None
    status = {}
    for item in raw.split(",")[1:]:
        if "=" in item:
            k, v = item.split("=", 1)
            status[k.strip()] = v.strip()
    return status
