from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

from train_xgb import prepare_features


ROOT = Path(__file__).resolve().parents[1]

SPLIT_DIR = ROOT / "ml" / "splits"
MODEL_DIR = ROOT / "ml" / "models"


def main() -> None:
    print("Loading test set...")

    test_df = pd.read_csv(
        SPLIT_DIR / "test.csv"
    )

    X_test, y_test_text = prepare_features(test_df)

    print(f"Test rows: {len(X_test):,}")
    print(f"Features: {X_test.shape[1]}")

    # --------------------------------------------------
    # Load trained model + label encoder
    # --------------------------------------------------

    model = __import__("xgboost").XGBClassifier()
    model.load_model(
        MODEL_DIR / "xgb_baseline.json"
    )

    encoder = joblib.load(
        MODEL_DIR / "label_encoder.pkl"
    )

    # --------------------------------------------------
    # Predict
    # --------------------------------------------------

    print("\nRunning predictions...")

    y_pred_encoded = model.predict(X_test)

    y_pred = encoder.inverse_transform(
        y_pred_encoded.astype(int)
    )

    # --------------------------------------------------
    # Metrics
    # --------------------------------------------------

    accuracy = accuracy_score(
        y_test_text,
        y_pred,
    )

    print("\n" + "=" * 70)
    print("XGBOOST TEST RESULTS")
    print("=" * 70)

    print(
        f"\nAccuracy: {accuracy:.4f} "
        f"({accuracy * 100:.2f}%)"
    )

    print("\nClassification Report:")
    print(
        classification_report(
            y_test_text,
            y_pred,
            digits=4,
            zero_division=0,
        )
    )

    # --------------------------------------------------
    # Confusion matrix
    # --------------------------------------------------

    labels = encoder.classes_

    matrix = confusion_matrix(
        y_test_text,
        y_pred,
        labels=labels,
    )

    print("\nConfusion Matrix:")
    print(
        pd.DataFrame(
            matrix,
            index=labels,
            columns=labels,
        )
    )

    # --------------------------------------------------
    # Prediction distribution
    # --------------------------------------------------

    print("\nPredicted class distribution:")
    print(
        pd.Series(y_pred)
        .value_counts()
        .sort_index()
    )


if __name__ == "__main__":
    main()