import sys
sys.path.insert(0, "C:\\tensorflow")
import tensorflow as tf
import os

import cv2

# Ensure no GPU usage
print("Num GPUs Available: ", len(tf.config.experimental.list_physical_devices('GPU')))
if len(tf.config.experimental.list_physical_devices('GPU')) > 0:
    print("Disabling GPU usage.")
    tf.config.set_visible_devices([], 'GPU')

# Enable mixed precision
from tensorflow.keras import mixed_precision
mixed_precision.set_global_policy('mixed_float16')

# Avoid ODM errors by setting GPU Memory Consumption Growth
gpus = tf.config.experimental.list_physical_devices('GPU')
for gpu in gpus:
    tf.config.experimental.set_memory_growth(gpu, True)

#tf.data.Dataset

import numpy as np
from matplotlib import pyplot as plt

num_classes = 9  # Replace with the actual number of categories

data = tf.keras.utils.image_dataset_from_directory(
    "C:/Users/ienye/OneDrive - University of Miami/Documents/Hackathon/data2",
    image_size=(128, 128)  # Adjust image size to 128x128 for faster processing
)

# Get class names
class_names = data.class_names

# Data augmentation
data_augmentation = tf.keras.Sequential([
    tf.keras.layers.RandomFlip("horizontal_and_vertical"),
    tf.keras.layers.RandomRotation(0.2),
    tf.keras.layers.RandomZoom(0.2),
])

# Pipeline data transformation
data = data.map(lambda x, y: (data_augmentation(x) / 255, tf.one_hot(y, depth=num_classes)))

data_iterator = data.as_numpy_iterator()
batch = data_iterator.next()
# Class names in doc
print(batch[1].shape)

fig, ax = plt.subplots(ncols=10, figsize=(20, 20))
for idx, img in enumerate(batch[0][:10]):
    ax[idx].imshow(img.astype(np.float32))  # Ensure the correct dtype
    ax[idx].title.set_text(class_names[np.argmax(batch[1][idx])])
plt.tight_layout()
plt.show()

print(len(data))

train_size = int(len(data) * 0.7)
val_size = int(len(data) * 0.20)
test_size = int(len(data) * 0.10)

print("train size: ", train_size)
print("val size: ", val_size)
print("test size: ", test_size)

train = data.take(train_size)
val = data.skip(train_size).take(val_size)
test = data.skip(train_size + val_size).take(test_size)

# Optimize data pipeline
AUTOTUNE = tf.data.AUTOTUNE
train = train.cache().shuffle(1000).prefetch(buffer_size=AUTOTUNE)
val = val.cache().prefetch(buffer_size=AUTOTUNE)
test = test.cache().prefetch(buffer_size=AUTOTUNE)

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout, Input, BatchNormalization

model = Sequential()

model.add(Input(shape=(128, 128, 3)))  # Adjust input shape to 128x128
model.add(Conv2D(32, (3, 3), activation='relu'))
model.add(BatchNormalization())
model.add(MaxPooling2D())
model.add(Dropout(0.25))

model.add(Conv2D(64, (3, 3), activation='relu'))
model.add(BatchNormalization())
model.add(MaxPooling2D())
model.add(Dropout(0.25))

model.add(Conv2D(128, (3, 3), activation='relu'))
model.add(BatchNormalization())
model.add(MaxPooling2D())
model.add(Dropout(0.25))

model.add(Flatten())
model.add(Dense(256, activation='relu'))
model.add(Dropout(0.5))
model.add(Dense(num_classes, activation='softmax'))

model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001), loss=tf.keras.losses.CategoricalCrossentropy(), metrics=['accuracy'])  # Adjusted learning rate

model.summary()

from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=5, min_lr=0.00001)

logdir = 'logs'
tensorboard_callback = tf.keras.callbacks.TensorBoard(log_dir=logdir)
hist = model.fit(train, epochs=5, batch_size=32, validation_data=val, callbacks=[tensorboard_callback, early_stopping, reduce_lr])

fig = plt.figure()
plt.plot(hist.history['loss'], label='loss', color='teal')
plt.plot(hist.history['val_loss'], label='val_loss', color='orange')
fig.suptitle('Loss')
plt.legend(loc="upper left")
plt.tight_layout()
plt.show()

fig = plt.figure()
plt.plot(hist.history['accuracy'], label='accuracy', color='teal')
plt.plot(hist.history['val_accuracy'], label='val_accuracy', color='orange')
fig.suptitle('Accuracy')
plt.legend(loc="upper left")
plt.tight_layout()
plt.show()

from tensorflow.keras.metrics import Precision, Recall, BinaryAccuracy
pre = Precision()
re = Recall()
acc = BinaryAccuracy()
for batch in test.as_numpy_iterator():
    X, y = batch
    yhat = model.predict(X)
    pre.update_state(y, yhat)
    re.update_state(y, yhat)
    acc.update_state(y, yhat)
print(pre.result(), re.result(), acc.result())

from tensorflow.keras.models import load_model

# Save the trained model
model.save(os.path.join('models','produce_classifier.h5'))

# Load the trained model
new_model = load_model('models/produce_classifier.h5')

# Load and preprocess the image
def predict_image(image_path):
    img = cv2.imread(image_path)
    plt.imshow(img)
    plt.show()
    resize = tf.image.resize(img, (128, 128))
    plt.imshow(resize.numpy().astype(np.float32))  # Ensure the correct dtype
    plt.show()

    # Predict the class of the image
    yhat = new_model.predict(np.expand_dims(resize / 255, 0))

    # Print raw predictions for debugging
    print(f'Raw predictions for {image_path}: {yhat}')

    # Get the predicted class
    predicted_class = class_names[np.argmax(yhat)]
    print(f'Predicted class for {image_path} is {predicted_class}')

# List of image paths to test
image_paths = [
    "C:/Users/ienye/OneDrive - University of Miami/Documents/Hackathon/test/ripe_bellpepper.jpg",
    "C:/Users/ienye/OneDrive - University of Miami/Documents/Hackathon/test/tomato.jpg",
    "C:/Users/ienye/OneDrive - University of Miami/Documents/Hackathon/test/unripe_tomato.jpg",
    # Add more image paths as needed
]

# Test multiple images
for image_path in image_paths:
    predict_image(image_path)