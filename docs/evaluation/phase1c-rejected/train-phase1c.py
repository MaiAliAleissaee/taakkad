"""Offline supervised training: URL-only, three candidates, validation selection only."""
import hashlib
import json
from pathlib import Path
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score, accuracy_score
import sklearn

data_path = Path('docs/evaluation/phase1c-data.json')
data = json.loads(data_path.read_text())
def arrays(part):
    rows = data['splits'][part]
    return np.array([r['features'] for r in rows]), np.array([1-r['label'] for r in rows])
X, y = arrays('train')
V, vy = arrays('validation')
def metrics(labels, pred):
    tn, fp, fn, tp = confusion_matrix(labels, pred, labels=[0,1]).ravel()
    return dict(tp=int(tp),tn=int(tn),fp=int(fp),fn=int(fn),precision=float(precision_score(labels,pred,zero_division=0)),recall=float(recall_score(labels,pred)),f1=float(f1_score(labels,pred)),accuracy=float(accuracy_score(labels,pred)),falsePositiveRate=float(fp/(fp+tn)))
models = {
    'logistic': make_pipeline(StandardScaler(), LogisticRegression(max_iter=600, random_state=17)),
    'tree': DecisionTreeClassifier(max_depth=5, min_samples_leaf=40, random_state=17),
    'gradient_boosting': GradientBoostingClassifier(n_estimators=40,max_depth=3,min_samples_leaf=30,learning_rate=0.1,random_state=17),
}
results = {}
for name, model in models.items():
    model.fit(X,y)
    scores = model.predict_proba(V)[:,1]
    candidates = [(float(t),metrics(vy,scores>=t)) for t in np.arange(.1,.951,.025)]
    feasible = [c for c in candidates if c[1]['falsePositiveRate']<=.05]
    threshold, measured = max(feasible or candidates,key=lambda c:c[1]['f1'])
    results[name] = dict(threshold=threshold,validation=measured)
best = max(results,key=lambda n: (results[n]['validation']['falsePositiveRate']<=.05,results[n]['validation']['f1']))
model = models[best]
def tree(t, regression=False):
    values = t.value[:,0,0] if regression else t.value[:,0,1]/t.value[:,0,:].sum(axis=1)
    return dict(left=t.children_left.tolist(),right=t.children_right.tolist(),feature=t.feature.tolist(),threshold=t.threshold.tolist(),value=values.tolist())
artifact = dict(version='phase1c-v1', kind=best, featureNames=data['features'], threshold=results[best]['threshold'], dataSha256=hashlib.sha256(data_path.read_bytes()).hexdigest(),trainingRows=len(y),validationRows=len(vy))
if best=='logistic':
    scaler,lr=model.steps[0][1],model.steps[1][1]
    artifact.update(mean=scaler.mean_.tolist(),scale=scaler.scale_.tolist(),weights=lr.coef_[0].tolist(),intercept=float(lr.intercept_[0]))
elif best=='tree': artifact.update(trees=[tree(model.tree_)])
else:
    p=model.init_.class_prior_[1]
    artifact.update(trees=[tree(t[0].tree_,True) for t in model.estimators_],intercept=float(np.log(p/(1-p))),learningRate=model.learning_rate)
Path('src/lib/services/url/ml-model.json').write_text(json.dumps(artifact,separators=(',',':'))+'\n')
Path('docs/evaluation/phase1c-training.json').write_text(json.dumps(dict(sklearn=sklearn.__version__,selection='Maximum validation F1 among thresholds with validation FPR <= 5%, preferred across three candidates; no test prediction or retraining',models=results,selected=best,artifactSha256=hashlib.sha256(Path('src/lib/services/url/ml-model.json').read_bytes()).hexdigest()),indent=2)+'\n')
# Small cross-runtime reference predictions from validation only.
Path('docs/evaluation/phase1c-parity.json').write_text(json.dumps([dict(url=r['url'],score=float(s)) for r,s in zip(data['splits']['validation'][:40],model.predict_proba(V[:40])[:,1])],indent=2)+'\n')
print(json.dumps(dict(selected=best,models=results),indent=2))