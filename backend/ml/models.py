"""
CITYSYNC - Machine Learning Core Algorithms
Implements production Random Forest Regressor and Isolation Forest
with full mathematical rigor, evaluation metrics, and uncertainty intervals.
"""
import math
import random
from typing import List, Tuple, Dict, Any, Optional

def mean(values: List[float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)

def variance(values: List[float]) -> float:
    if len(values) < 2:
        return 0.0
    m = mean(values)
    return sum((x - m) ** 2 for x in values) / len(values)

def mean_absolute_error(y_true: List[float], y_pred: List[float]) -> float:
    if not y_true:
        return 0.0
    return sum(abs(t - p) for t, p in zip(y_true, y_pred)) / len(y_true)

def root_mean_squared_error(y_true: List[float], y_pred: List[float]) -> float:
    if not y_true:
        return 0.0
    mse = sum((t - p) ** 2 for t, p in zip(y_true, y_pred)) / len(y_true)
    return math.sqrt(mse)

def r2_score(y_true: List[float], y_pred: List[float]) -> float:
    if len(y_true) < 2:
        return 1.0
    y_mean = mean(y_true)
    ss_tot = sum((y - y_mean) ** 2 for y in y_true)
    if ss_tot == 0.0:
        return 1.0
    ss_res = sum((t - p) ** 2 for t, p in zip(y_true, y_pred))
    return round(1.0 - (ss_res / ss_tot), 4)

def classification_metrics(y_true: List[int], y_pred: List[int]) -> Dict[str, float]:
    tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)
    tn = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 0)
    
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    accuracy = (tp + tn) / len(y_true) if y_true else 0.0
    
    return {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "accuracy": round(accuracy, 4),
        "true_positives": tp,
        "false_positives": fp,
        "false_negatives": fn,
        "true_negatives": tn
    }


# ==========================================
# 1. Random Forest Regressor Implementation
# ==========================================

class Node:
    """Decision Tree split node or leaf."""
    def __init__(
        self,
        feature_idx: Optional[int] = None,
        threshold: Optional[float] = None,
        left: Optional['Node'] = None,
        right: Optional['Node'] = None,
        value: Optional[float] = None
    ):
        self.feature_idx = feature_idx
        self.threshold = threshold
        self.left = left
        self.right = right
        self.value = value

    @property
    def is_leaf(self) -> bool:
        return self.value is not None


class DecisionTreeRegressor:
    """Fast, robust regression tree using variance reduction."""
    def __init__(self, max_depth: int = 8, min_samples_split: int = 4, max_features: Optional[int] = None):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.max_features = max_features
        self.root: Optional[Node] = None

    def fit(self, X: List[List[float]], y: List[float], rng: random.Random):
        self.root = self._build_tree(X, y, depth=0, rng=rng)

    def _build_tree(self, X: List[List[float]], y: List[float], depth: int, rng: random.Random) -> Node:
        n_samples = len(X)
        if n_samples == 0:
            return Node(value=0.0)
        
        leaf_value = mean(y)
        if depth >= self.max_depth or n_samples < self.min_samples_split:
            return Node(value=leaf_value)
        
        n_features = len(X[0])
        # Feature subsampling
        if self.max_features and self.max_features < n_features:
            feature_indices = rng.sample(range(n_features), self.max_features)
        else:
            feature_indices = list(range(n_features))
            
        best_feat = None
        best_thresh = None
        best_var_red = 0.0
        current_var = variance(y) * n_samples
        
        for feat in feature_indices:
            vals = [row[feat] for row in X]
            unique_vals = sorted(list(set(vals)))
            if len(unique_vals) <= 1:
                continue
            
            # Subsample candidate split thresholds for speed on large datasets
            step = max(1, len(unique_vals) // 8)
            candidate_thresholds = [unique_vals[i] for i in range(0, len(unique_vals), step)]
            
            for thresh in candidate_thresholds:
                left_y = [y[i] for i in range(n_samples) if X[i][feat] <= thresh]
                right_y = [y[i] for i in range(n_samples) if X[i][feat] > thresh]
                
                if len(left_y) < 2 or len(right_y) < 2:
                    continue
                
                var_red = current_var - (variance(left_y) * len(left_y) + variance(right_y) * len(right_y))
                if var_red > best_var_red:
                    best_var_red = var_red
                    best_feat = feat
                    best_thresh = thresh
                    
        if best_feat is None or best_var_red <= 0.0:
            return Node(value=leaf_value)
            
        left_X = [X[i] for i in range(n_samples) if X[i][best_feat] <= best_thresh]
        left_y = [y[i] for i in range(n_samples) if X[i][best_feat] <= best_thresh]
        right_X = [X[i] for i in range(n_samples) if X[i][best_feat] > best_thresh]
        right_y = [y[i] for i in range(n_samples) if X[i][best_feat] > best_thresh]
        
        left_node = self._build_tree(left_X, left_y, depth + 1, rng)
        right_node = self._build_tree(right_X, right_y, depth + 1, rng)
        
        return Node(feature_idx=best_feat, threshold=best_thresh, left=left_node, right=right_node)

    def predict_one(self, x: List[float]) -> float:
        curr = self.root
        while not curr.is_leaf:
            if x[curr.feature_idx] <= curr.threshold:
                curr = curr.left
            else:
                curr = curr.right
        return curr.value


class RandomForestRegressor:
    """
    Ensemble Random Forest Regressor.
    Predicts point estimate (mean of trees) and uncertainty (standard deviation).
    """
    def __init__(self, n_estimators: int = 15, max_depth: int = 7, min_samples_split: int = 4, random_state: int = 42):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.random_state = random_state
        self.trees: List[DecisionTreeRegressor] = []
        self.feature_names: List[str] = []

    def fit(self, X: List[List[float]], y: List[float], feature_names: Optional[List[str]] = None):
        self.feature_names = feature_names or [f"f_{i}" for i in range(len(X[0]))]
        self.trees = []
        n_samples = len(X)
        n_features = len(X[0])
        max_feat = max(1, int(math.sqrt(n_features)))
        
        rng = random.Random(self.random_state)
        
        for _ in range(self.n_estimators):
            # Bootstrap sample
            boot_indices = [rng.randint(0, n_samples - 1) for _ in range(n_samples)]
            boot_X = [X[i] for i in boot_indices]
            boot_y = [y[i] for i in boot_indices]
            
            tree = DecisionTreeRegressor(
                max_depth=self.max_depth,
                min_samples_split=self.min_samples_split,
                max_features=max_feat
            )
            tree.fit(boot_X, boot_y, rng=rng)
            self.trees.append(tree)

    def predict(self, X: List[List[float]]) -> List[float]:
        predictions = []
        for row in X:
            tree_preds = [tree.predict_one(row) for tree in self.trees]
            predictions.append(mean(tree_preds))
        return predictions

    def predict_with_intervals(self, X: List[List[float]], confidence: float = 0.90) -> List[Dict[str, float]]:
        """Compute point prediction, lower/upper confidence bounds, and standard deviation."""
        z_multiplier = 1.645 if confidence >= 0.90 else 1.96
        results = []
        for row in X:
            tree_preds = [tree.predict_one(row) for tree in self.trees]
            m = mean(tree_preds)
            std = math.sqrt(variance(tree_preds))
            lower = max(0.0, m - z_multiplier * std)
            upper = m + z_multiplier * std
            results.append({
                "predicted": round(m, 2),
                "lower_bound": round(lower, 2),
                "upper_bound": round(upper, 2),
                "uncertainty_std": round(std, 2)
            })
        return results


# ==========================================
# 2. Isolation Forest Anomaly Detection
# ==========================================

class IsolationTreeNode:
    def __init__(
        self,
        left: Optional['IsolationTreeNode'] = None,
        right: Optional['IsolationTreeNode'] = None,
        split_feature: Optional[int] = None,
        split_value: Optional[float] = None,
        size: int = 0
    ):
        self.left = left
        self.right = right
        self.split_feature = split_feature
        self.split_value = split_value
        self.size = size

    @property
    def is_leaf(self) -> bool:
        return self.left is None and self.right is None


class IsolationForest:
    """
    Isolation Forest for Unsupervised Anomaly Detection (Liu et al. 2008).
    Isolates anomalies by randomly selecting a feature and split value.
    Anomalies have shorter average path lengths in the isolation trees.
    """
    def __init__(self, n_estimators: int = 25, max_samples: int = 256, contamination: float = 0.05, random_state: int = 42):
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.contamination = contamination
        self.random_state = random_state
        self.trees: List[IsolationTreeNode] = []
        self.threshold: float = 0.55
        self.feature_names: List[str] = []

    @staticmethod
    def _c(n: int) -> float:
        """Average path length of unsuccessful search in BST."""
        if n <= 1:
            return 0.0
        if n == 2:
            return 1.0
        euler_gamma = 0.5772156649
        return 2.0 * (math.log(n - 1) + euler_gamma) - (2.0 * (n - 1) / n)

    def _build_itree(self, X: List[List[float]], current_depth: int, max_depth: int, rng: random.Random) -> IsolationTreeNode:
        n_samples = len(X)
        if current_depth >= max_depth or n_samples <= 1:
            return IsolationTreeNode(size=n_samples)
            
        n_features = len(X[0])
        # Randomly choose a feature
        feat_idx = rng.randint(0, n_features - 1)
        feat_vals = [row[feat_idx] for row in X]
        min_v = min(feat_vals)
        max_v = max(feat_vals)
        
        if min_v == max_v:
            return IsolationTreeNode(size=n_samples)
            
        split_val = rng.uniform(min_v, max_v)
        left_X = [row for row in X if row[feat_idx] < split_val]
        right_X = [row for row in X if row[feat_idx] >= split_val]
        
        left_child = self._build_itree(left_X, current_depth + 1, max_depth, rng)
        right_child = self._build_itree(right_X, current_depth + 1, max_depth, rng)
        
        return IsolationTreeNode(
            left=left_child,
            right=right_child,
            split_feature=feat_idx,
            split_value=split_val,
            size=n_samples
        )

    def fit(self, X: List[List[float]], feature_names: Optional[List[str]] = None):
        self.feature_names = feature_names or [f"f_{i}" for i in range(len(X[0]))]
        self.trees = []
        rng = random.Random(self.random_state)
        n_samples = len(X)
        sample_size = min(self.max_samples, n_samples)
        max_depth = math.ceil(math.log2(max(2, sample_size)))
        
        for _ in range(self.n_estimators):
            subsample = rng.sample(X, sample_size)
            tree = self._build_itree(subsample, 0, max_depth, rng)
            self.trees.append(tree)
            
        # Calibrate decision threshold based on contamination factor
        scores = self.decision_function(X)
        sorted_scores = sorted(scores, reverse=True) # Higher score = more anomalous
        thresh_idx = max(0, min(len(sorted_scores) - 1, int(len(sorted_scores) * self.contamination)))
        self.threshold = round(sorted_scores[thresh_idx], 4)

    def _path_length(self, x: List[float], node: IsolationTreeNode, current_depth: int) -> float:
        if node.is_leaf:
            return current_depth + self._c(node.size)
        if x[node.split_feature] < node.split_value:
            return self._path_length(x, node.left, current_depth + 1)
        else:
            return self._path_length(x, node.right, current_depth + 1)

    def decision_function(self, X: List[List[float]]) -> List[float]:
        """
        Calculates anomaly score s(x, n) = 2^(-E(h(x))/c(n)).
        Score near 1 indicates anomaly; score < 0.5 indicates normal.
        """
        c_factor = self._c(self.max_samples)
        scores = []
        for x in X:
            avg_path = mean([self._path_length(x, tree, 0) for tree in self.trees])
            if c_factor > 0:
                score = 2.0 ** (-avg_path / c_factor)
            else:
                score = 0.5
            scores.append(round(score, 4))
        return scores

    def predict(self, X: List[List[float]]) -> List[int]:
        """Returns 1 for anomaly, 0 for normal."""
        scores = self.decision_function(X)
        return [1 if s >= self.threshold else 0 for s in scores]
