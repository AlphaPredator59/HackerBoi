from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]

DATA_DIR = (
    PROJECT_ROOT
    / "solarmainframe"
    / "ids-intrusion-csv"
    / "versions"
    / "1"
)


def find_csv_files() -> list[Path]:
    """Return all CICIDS CSV files in the dataset directory."""
    files = sorted(DATA_DIR.glob("*.csv"))

    if not files:
        raise FileNotFoundError(
            f"No CSV files found in {DATA_DIR}"
        )

    return files


def load_csv(path: Path) -> pd.DataFrame:
    """Load one CICIDS CSV and normalize column names."""
    df = pd.read_csv(
        path,
        encoding="cp1252",
        low_memory=False,
    )

    df.columns = df.columns.str.strip()

    return df


def load_all_data() -> pd.DataFrame:
    """Load and concatenate all CICIDS CSV files."""
    frames: list[pd.DataFrame] = []

    for path in find_csv_files():
        print(f"Loading {path.name}...")

        df = load_csv(path)

        # Keep track of the source file.
        df["_source_file"] = path.name

        frames.append(df)

    combined = pd.concat(
        frames,
        ignore_index=True,
    )

    return combined


if __name__ == "__main__":
    df = load_all_data()

    print("\nDataset loaded successfully")
    print(f"Rows: {len(df):,}")
    print(f"Columns: {len(df.columns)}")

    if "Label" in df.columns:
        print("\nLabel distribution:")
        print(df["Label"].value_counts())