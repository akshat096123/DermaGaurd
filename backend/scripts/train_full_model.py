import os
os.environ["TQDM_DISABLE"] = "1"
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
import torchvision.models as models
import torchvision.transforms as T
import pandas as pd
import numpy as np
from PIL import Image
import json
import gc
from pathlib import Path
from sklearn.metrics import accuracy_score, f1_score

print("=== BUILDING OFFLINE DERMA DIAGNOSIS NET ===")
device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")

train_df = pd.read_csv("data/raw/Health/training/metadata.csv")
eval_df = pd.read_csv("data/raw/Health/eval/metadata.csv")
classes = ["akiec", "bcc", "bkl", "df", "mel", "nv", "vasc"]
class_to_idx = {c: i for i, c in enumerate(classes)}

class HamDataset(Dataset):
    def __init__(self, df, img_dir, transform=None):
        self.df = df.reset_index(drop=True)
        self.img_dir = Path(img_dir)
        self.transform = transform
        
    def __len__(self):
        return len(self.df)
        
    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = self.img_dir / f"{row['image_id']}.jpg"
        try:
            image = Image.open(img_path).convert("RGB")
        except Exception:
            image = Image.new("RGB", (224, 224), (128, 128))
            
        if self.transform:
            image = self.transform(image)
            
        label = class_to_idx.get(row['dx'], 0)
        age = row['age']
        age_val = 0.5 if pd.isna(age) else float(age) / 100.0
        age_missing = 1.0 if pd.isna(age) else 0.0
        
        meta = torch.zeros(19, dtype=torch.float32)
        meta[0] = age_val
        meta[1] = age_missing
        return image, meta, torch.tensor(label, dtype=torch.long)

train_transforms = T.Compose([
    T.Resize((224, 224)),
    T.RandomHorizontalFlip(),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

eval_transforms = T.Compose([
    T.Resize((224, 224)),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

train_ds = HamDataset(train_df, "data/raw/Health/training/images", transform=train_transforms)
eval_ds = HamDataset(eval_df, "data/raw/Health/eval/images", transform=eval_transforms)

class DermaNet(nn.Module):
    def __init__(self):
        super().__init__()
        # Use EfficientNet-B0 from torchvision (instant local load)
        base = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
        self.features = base.features
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.meta_fc = nn.Sequential(nn.Linear(19, 32), nn.LayerNorm(32), nn.GELU())
        self.head = nn.Sequential(nn.LayerNorm(1280 + 32), nn.Dropout(0.2), nn.Linear(1280 + 32, 7))
        
    def forward(self, img, meta):
        feat = self.features(img)
        feat = self.pool(feat).flatten(1)
        m_feat = self.meta_fc(meta)
        combined = torch.cat([feat, m_feat], dim=1)
        return self.head(combined)

model = DermaNet().to(device)

class_counts = train_df['dx'].value_counts()
weights = [1.0 / np.sqrt(class_counts.get(c, 1)) for c in train_df['dx']]
sampler = WeightedRandomSampler(weights, num_samples=len(weights), replacement=True)

train_loader = DataLoader(train_ds, batch_size=64, sampler=sampler, num_workers=0)
eval_loader = DataLoader(eval_ds, batch_size=64, shuffle=False, num_workers=0)

optimizer = torch.optim.AdamW(model.parameters(), lr=2e-4, weight_decay=1e-2)
criterion = nn.CrossEntropyLoss(label_smoothing=0.05)

print("=== STARTING FAST TRAINING (3 EPOCHS) ===")
for epoch in range(1, 4):
    model.train()
    total_loss = 0.0
    for imgs, metas, labels in train_loader:
        imgs, metas, labels = imgs.to(device), metas.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(imgs, metas)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    
    model.eval()
    all_preds, all_labels = [], []
    with torch.no_grad():
        for imgs, metas, labels in eval_loader:
            imgs, metas = imgs.to(device), metas.to(device)
            outputs = model(imgs, metas)
            preds = torch.argmax(outputs, dim=1).cpu().numpy()
            all_preds.extend(preds)
            all_labels.extend(labels.numpy())
            
    acc = accuracy_score(all_labels, all_preds)
    f1 = f1_score(all_labels, all_preds, average='macro', zero_division=0)
    print(f"Epoch {epoch}/3 | Loss: {total_loss/len(train_loader):.4f} | Val Acc: {acc*100:.2f}% | Val Macro-F1: {f1:.4f}", flush=True)
    torch.mps.empty_cache()
    gc.collect()

Path("backend/outputs").mkdir(parents=True, exist_ok=True)
torch.save(model.state_dict(), "backend/outputs/best_diagnosis_model.pth")
print("=== TRAINING & MODEL SAVE COMPLETE ===")
