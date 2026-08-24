from pathlib import Path

import pandas as pd
from fastapi import HTTPException

from app.services.storage import LocalDatasetStorage


def read_dataset(path: Path) -> pd.DataFrame:
    if path.suffix.lower() == ".csv":
        return pd.read_csv(path)
    if path.suffix.lower() in {".xlsx", ".xls"}:
        return pd.read_excel(path)
    raise HTTPException(status_code=415, detail="Only CSV and XLSX files are supported.")


def cleaned_copy(frame: pd.DataFrame, config: dict) -> pd.DataFrame:
    result = frame.copy()
    if config.get("drop_duplicates"):
        result = result.drop_duplicates()
    for column in config.get("drop_rows_with_missing", []):
        if column in result:
            result = result.dropna(subset=[column])
    for column, value in config.get("fill_missing", {}).items():
        if column in result:
            result[column] = result[column].fillna(value)
    return result
