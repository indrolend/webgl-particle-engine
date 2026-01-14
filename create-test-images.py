from PIL import Image, ImageDraw, ImageFont
import os

# Create test images directory
os.makedirs('/tmp/test-images', exist_ok=True)

# Image 1: Circle
img1 = Image.new('RGB', (400, 400), color='black')
draw1 = ImageDraw.Draw(img1)
draw1.ellipse([100, 100, 300, 300], fill='#667eea', outline='#764ba2', width=5)
img1.save('/tmp/test-images/image1.png')
print("Created image1.png")

# Image 2: Star
img2 = Image.new('RGB', (400, 400), color='black')
draw2 = ImageDraw.Draw(img2)
# Draw a star shape using polygon
star_points = [
    (200, 50),   # top
    (220, 150),  # top right inner
    (300, 150),  # top right
    (240, 210),  # right inner
    (270, 300),  # bottom right
    (200, 250),  # bottom inner
    (130, 300),  # bottom left
    (160, 210),  # left inner
    (100, 150),  # top left
    (180, 150),  # top left inner
]
draw2.polygon(star_points, fill='#f093fb', outline='#f5576c', width=5)
img2.save('/tmp/test-images/image2.png')
print("Created image2.png")

# Image 3: Heart
img3 = Image.new('RGB', (400, 400), color='black')
draw3 = ImageDraw.Draw(img3)
# Draw heart using two circles and a triangle
draw3.ellipse([80, 100, 180, 200], fill='#ff5252')
draw3.ellipse([220, 100, 320, 200], fill='#ff5252')
draw3.polygon([(80, 150), (320, 150), (200, 330)], fill='#ff5252')
img3.save('/tmp/test-images/image3.png')
print("Created image3.png")

print("\nTest images created in /tmp/test-images/")
