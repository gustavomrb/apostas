import numpy as np
import json
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
import logging
import datetime

np.set_printoptions(suppress = True)
logging.getLogger("tensorflow").setLevel(logging.ERROR)
tf.autograph.set_verbosity(0)
tf.random.set_seed(1234)

torneio = "lcs"

with open("./geradores/lol/" + torneio + "/gameLines.json") as file:
    data = json.load(file)

with open("./geradores/lol/" + torneio + "/gameLinesPreview.json") as file:
    data_prev = json.load(file)

def getXArray(data):
    X = [];
    for gameLine in data:
        X.append([
            gameLine["teamAWR"],
            gameLine["teamAKDR"],
            gameLine["teamAGPM"],
            gameLine["teamAOppGPM"],
            gameLine["teamAGDPM"],
            gameLine["teamAAGD"],
            gameLine["teamAKPG"],
            gameLine["teamADPG"],
            gameLine["teamATKPG"],
            gameLine["teamATLPG"],
            gameLine["teamAFBR"],
            gameLine["teamAFTR"],
            gameLine["teamAWRL3"],
            gameLine["teamAKDRL3"],
            gameLine["teamAGPML3"],
            gameLine["teamAOppGPML3"],
            gameLine["teamAGDPML3"],
            gameLine["teamAAGDL3"],
            gameLine["teamAKPGL3"],
            gameLine["teamADPGL3"],
            gameLine["teamATKPGL3"],
            gameLine["teamATLPGL3"],
            gameLine["teamAFBRL3"],
            gameLine["teamAFTRL3"],
            gameLine["teamBWR"],
            gameLine["teamBKDR"],
            gameLine["teamBGPM"],
            gameLine["teamBOppGPM"],
            gameLine["teamBGDPM"],
            gameLine["teamBAGD"],
            gameLine["teamBKPG"],
            gameLine["teamBDPG"],
            gameLine["teamBTKPG"],
            gameLine["teamBTLPG"],
            gameLine["teamBFBR"],
            gameLine["teamBFTR"],
            gameLine["teamBWRL3"],
            gameLine["teamBKDRL3"],
            gameLine["teamBGPML3"],
            gameLine["teamBOppGPML3"],
            gameLine["teamBGDPML3"],
            gameLine["teamBAGDL3"],
            gameLine["teamBKPGL3"],
            gameLine["teamBDPGL3"],
            gameLine["teamBTKPGL3"],
            gameLine["teamBTLPGL3"],
            gameLine["teamBFBRL3"],
            gameLine["teamBFTRL3"]
        ]);
    return np.array(X);

def getYArray(data):
    y = [];
    for gameLine in data:
        y.append([gameLine["over12towers"]])
    return np.array(y);

x_train = getXArray(data)
y_train = getYArray(data)
x_validate = x_train[-20:]
y_validate = y_train[-20:]
x_train = x_train[:-20]
y_train = y_train[:-20]
#x_train = np.tile(x_train,(100000,1))
#y_train = np.tile(y_train,(100000,1))

norm_l = tf.keras.layers.Normalization(axis=-1)
norm_l.adapt(x_train)  # learns mean, variance
x_norm = norm_l(x_train).numpy()
x_validate_norm = norm_l(x_validate).numpy()

model = Sequential(
    [
        Dense(8, activation='relu'),
        Dense(1, activation='sigmoid')
    ]
)

model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
              loss = tf.keras.losses.BinaryCrossentropy(), metrics=['accuracy'])

log_dir = "logs/fit/" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
tensorboard_callback = tf.keras.callbacks.TensorBoard(log_dir=log_dir, histogram_freq=1)

model.fit(x_norm,y_train,epochs=2000, validation_data=(x_validate_norm,y_validate), batch_size=3, callbacks=[tensorboard_callback])

x_predict = getXArray(data_prev)
x_predict_norm = norm_l(x_predict)
print(model.predict(x_predict_norm))

"""scaler = StandardScaler()
x_norm = scaler.fit_transform(x_train)

lr_model = LogisticRegression()
lr_model.fit(x_norm, y_train)
print("Accuracy on training set:", lr_model.score(x_norm, y_train))

x_predict = getXArray(data_prev)
x_predict_norm = scaler.transform(x_predict)
print(lr_model.predict(x_predict_norm))
print(lr_model.predict_proba(x_predict_norm))"""