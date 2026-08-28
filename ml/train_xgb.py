from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from xgboost import XGBClassifier
from sklearn.preprocessing import LabelEncoder


ROOT = Path(__file__).resolve().parents[1]
SPLIT_DIR = ROOT / "ml" / "splits"
MODEL_DIR = ROOT / "ml" / "models"

MODEL_DIR.mkdir(parents=True, exist_ok=True)


def load_split(name: str) -> pd.DataFrame:
    return pd.read_csv(SPLIT_DIR / f"{name}.csv")


def prepare_features(
    df: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.Series]:
    """
    Separate features from labels and remove non-ML metadata.
    """

    X = df.drop(
        columns=["Label", "_source_file"],
        errors="ignore",
    ).copy()

    y = df["Label"].copy()

    # Make absolutely sure everything is numeric.
    X = X.apply(pd.to_numeric, errors="coerce")

    # Replace any remaining invalid values.
    X = X.replace([float("inf"), float("-inf")], pd.NA)

    if X.isna().any().any():
        raise ValueError(
            "Invalid values found in feature matrix."
        )

    return X, y


def main() -> None:
    print("Loading splits...")

    train_df = load_split("train")
    val_df = load_split("validation")

    X_train, y_train_text = prepare_features(train_df)
    X_val, y_val_text = prepare_features(val_df)

    print(f"Training rows:   {len(X_train):,}")
    print(f"Validation rows: {len(X_val):,}")
    print(f"Feature count:   {X_train.shape[1]}")

    # --------------------------------------------------
    # Encode labels
    # --------------------------------------------------

    encoder = LabelEncoder()

    y_train = encoder.fit_transform(y_train_text)
    y_val = encoder.transform(y_val_text)

    print("\nClasses:")
    for idx, label in enumerate(encoder.classes_):
        print(f"{idx}: {label}")

    # --------------------------------------------------
    # Train XGBoost
    # --------------------------------------------------

    print("\nTraining XGBoost...")

    model = XGBClassifier(
        objective="multi:softprob",
        num_class=len(encoder.classes_),
        n_estimators=300,
        max_depth=8,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        tree_method="hist",
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=-1,
    )

    model.fit(
        X_train,
        y_train,
        eval_set=[
            (X_val, y_val),
        ],
        verbose=True,
    )

    # --------------------------------------------------
    # Save model
    # --------------------------------------------------

    model_path = MODEL_DIR / "xgb_baseline.json"
    encoder_path = MODEL_DIR / "label_encoder.pkl"

    model.save_model(model_path)
    joblib.dump(encoder, encoder_path)

    print("\nSaved:")
    print(model_path)
    print(encoder_path)


if __name__ == "__main__":
    main()