import pandas as pd
from pathlib import Path

# Всички CSV файлове в текущата директория
csv_files = Path(".").glob("*.csv")

# Колони, които може да съдържат Unix time в милисекунди
timestamp_columns = ["created_at", "updated_at", "published_at", "time"]

for file in csv_files:
    df = pd.read_csv(file)

    for col in timestamp_columns:
        if col in df.columns:
            try:
                df[col] = pd.to_datetime(df[col], unit="ms", errors="coerce")
            except Exception as e:
                print(f"Error converting {col} in {file}: {e}")

    df.to_csv(file, index=False)
    print(f"✅ Fixed timestamps in {file}")

# Специален фикс за колоната new_product в products.csv
products_file = Path("products.csv")
if products_file.exists():
    df = pd.read_csv(products_file)
    if "new_product" in df.columns:
        df["new_product"] = df["new_product"].apply(lambda x: True if x in [1, 1.0, "1", "1.0", True] else False)
        df.to_csv(products_file, index=False)
        print("✅ Fixed boolean values in products.csv")