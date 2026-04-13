import time
from pathlib import Path

# Map waar script staat
base_path = Path(__file__).parent

converted = 0
removed = 0
errors = 0
log = []

# Alle bestanden (recursief)
for file in base_path.rglob("*"):
    if file.is_file() and file.suffix.lower() == ".jpg":
        new_file = file.with_suffix(".jpeg")

        try:
            if new_file.exists():
                file.unlink()
                log.append(f"Verwijderd: {file}")
                removed += 1
            else:
                file.rename(new_file)
                log.append(f"Omgezet: {file} -> {new_file}")
                converted += 1
        except Exception as e:
            log.append(f"Fout bij {file}: {e}")
            errors += 1

# Resultaat
print("\n===== RESULTAAT =====")
print(f"Omgezet: {converted}")
print(f"Verwijderd: {removed}")
print(f"Fouten: {errors}")

print("\nDetails:")
for line in log:
    print(line)

print("\nSluit over 5 seconden...")
time.sleep(5)