from azure.storage.blob import BlobServiceClient
from fastapi import UploadFile

from app.core.config import settings


class BlobStorageService:
    def __init__(self):
        self.blob_service_client = BlobServiceClient.from_connection_string(
            settings.azure_storage_connection_string
        )
        self.container_name = settings.azure_storage_container_name

    async def upload_file(self, file: UploadFile, blob_name: str) -> str:
        blob_client = self.blob_service_client.get_blob_client(
            container=self.container_name,
            blob=blob_name
        )

        content = await file.read()
        blob_client.upload_blob(content, overwrite=True)

        return blob_client.url