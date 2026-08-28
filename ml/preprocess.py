from __future__ import annotations

import numpy as np
import pandas as pd


# Labels exactly as they should appear in our project.
LABEL_MAP = {
    "BENIGN": "BENIGN",
    "DoS Hulk": "DoS Hulk",
    "PortScan": "PortScan",
    "DDoS": "DDoS",
    "DoS GoldenEye": "DoS GoldenEye",
    "FTP-Patator": "FTP-Patator",
    "SSH-Patator": "SSH-Patator",
    "DoS slowloris": "DoS slowloris",
    "DoS Slowhttptest": "DoS Slowhttptest",
    "Bot": "Bot",
    "Web Attack ï¿½ Brute Force": "Web Attack Brute Force",
    "Web Attack ï¿½ XSS": "Web Attack XSS",
    "Infiltration": "Infiltration",
    "Web Attack ï¿½ Sql Injection": "Web Attack SQL Injection",
    "Heartbleed": "Heartbleed",
}


def clean_labels(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize dataset labels."""
    df = df.copy()

    df["Label"] = (
        df["Label"]
        .astype(str)
        .str.strip()
        .replace(LABEL_MAP)
    )

    return df


def clean_features(df: pd.DataFrame) -> pd.DataFrame:
    """Convert all feature columns to numeric and remove invalid rows."""
    df = df.copy()

    # These are metadata, not ML features.
    metadata_columns = [
        "Label",
        "_source_file",
    ]

    feature_columns = [
        col for col in df.columns
        if col not in metadata_columns
    ]

    # Convert every feature to numeric.
    for column in feature_columns:
        df[column] = pd.to_numeric(
            df[column],
            errors="coerce",
        )

    # Replace infinite values with NaN.
    df[feature_columns] = df[feature_columns].replace(
        [np.inf, -np.inf],
        np.nan,
    )

    # Remove rows containing invalid feature values.
    before = len(df)

    df = df.dropna(
        subset=feature_columns
    ).reset_index(drop=True)

    removed = before - len(df)

    print(f"Removed invalid rows: {removed:,}")

    return df


def preprocess(df: pd.DataFrame) -> pd.DataFrame:
    """Run the complete preprocessing pipeline."""
    if "Label" not in df.columns:
        raise ValueError("Dataset must contain a 'Label' column.")

    df = clean_labels(df)
    df = clean_features(df)

    return df


if __name__ == "__main__":
    from data import load_all_data

    print("Loading dataset...")
    df = load_all_data()

    print("\nBefore preprocessing:")
    print(f"Rows: {len(df):,}")
    print(f"Columns: {len(df.columns)}")

    df = preprocess(df)

    print("\nAfter preprocessing:")
    print(f"Rows: {len(df):,}")
    print(f"Columns: {len(df.columns)}")

    print("\nNormalized labels:")
    print(df["Label"].value_counts())