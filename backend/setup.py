#!/usr/bin/env python3
"""
Setup script for Enhanced Sign Language Translator Backend
Integrates SLT Framework with FastAPI for real-time processing
"""

from setuptools import setup, find_packages
import sys
import os

# Read README for long description
def read_readme():
    try:
        with open("README.md", "r", encoding="utf-8") as fh:
            return fh.read()
    except FileNotFoundError:
        return "Enhanced Sign Language Translator Backend with SLT Framework integration"

# Read requirements
def read_requirements():
    try:
        with open("requirements.txt", "r", encoding="utf-8") as fh:
            return [line.strip() for line in fh if line.strip() and not line.startswith("#")]
    except FileNotFoundError:
        return [
            "fastapi>=0.104.1",
            "uvicorn[standard]>=0.24.0",
            "websockets>=12.0",
                    "sign-language-translator>=0.8.1",
        "opencv-python>=4.9.0.80", 
        "numpy>=1.26.0",
        "mediapipe>=0.10.8",
            "pydantic>=2.5.0"
        ]

setup(
    name="slt-translator-backend",
    version="2.0.0",
    author="Enhanced SLT Development Team",
    author_email="dev@slt-translator.com",
    description="Enhanced Sign Language Translator Backend with SLT Framework",
    long_description=read_readme(),
    long_description_content_type="text/markdown",
    url="https://github.com/your-org/slt-translator-backend",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: Education",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Multimedia :: Video",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Scientific/Engineering :: Human Machine Interfaces",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.8,<3.13",
    install_requires=read_requirements(),
    extras_require={
        "dev": [
            "pytest>=7.4.3",
            "pytest-asyncio>=0.21.1",
            "httpx>=0.25.2",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "mypy>=1.0.0",
        ],
        "gpu": [
            "tensorflow-gpu>=2.13.0",
            "torch>=2.0.0",
            "torchvision>=0.15.0",
        ],
        "audio": [
            "librosa>=0.10.1",
            "soundfile>=0.12.1",
            "pyaudio>=0.2.11",
        ],
        "database": [
            "sqlalchemy>=2.0.23",
            "alembic>=1.13.0",
            "redis>=5.0.1",
        ],
        "production": [
            "gunicorn>=21.2.0",
            "nginx>=1.0.0",
            "docker>=6.0.0",
        ],
        "all": [
            "pytest>=7.4.3",
            "pytest-asyncio>=0.21.1",
            "httpx>=0.25.2",
            "tensorflow-gpu>=2.13.0",
            "torch>=2.0.0",
            "librosa>=0.10.1",
            "sqlalchemy>=2.0.23",
            "gunicorn>=21.2.0",
        ]
    },
    entry_points={
        "console_scripts": [
            "slt-backend=main:main",
            "slt-server=main:run_server",
        ],
    },
    include_package_data=True,
    package_data={
        "": ["*.txt", "*.md", "*.yml", "*.yaml", "*.json"],
    },
    project_urls={
        "Bug Reports": "https://github.com/your-org/slt-translator-backend/issues",
        "Source": "https://github.com/your-org/slt-translator-backend",
        "Documentation": "https://slt-translator-backend.readthedocs.io/",
        "SLT Framework": "https://github.com/sign-language-translator/sign-language-translator",
    },
    keywords=[
        "sign-language",
        "translation",
        "ASL",
        "computer-vision",
        "mediapipe", 
        "fastapi",
        "websockets",
        "real-time",
        "accessibility",
        "AI",
        "machine-learning",
        "deep-learning",
        "gesture-recognition",
        "hand-tracking",
        "pose-estimation"
    ],
)

if __name__ == "__main__":
    print("Setting up Enhanced Sign Language Translator Backend...")
    print("This will install the SLT Framework and all dependencies")
    print("Make sure you have Python 3.8+ installed")
    print()
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("Error: Python 3.8 or higher is required")
        sys.exit(1)
    
    print(f"Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro} detected")
    print()
    
    # Installation instructions
    print("Installation Commands:")
    print("  Basic installation:")
    print("    pip install -e .")
    print()
    print("  Development installation (recommended):")
    print("    pip install -e .[dev]")
    print()
    print("  Full installation with all features:")
    print("    pip install -e .[all]")
    print()
    print("  GPU support (for better performance):")
    print("    pip install -e .[gpu]")
    print()
    print("After installation, run:")
    print("    python main.py")
    print("    # or")
    print("    uvicorn main:app --host 0.0.0.0 --port 8000 --reload")
    print()
    print("Documentation:")
    print("  SLT Framework: https://github.com/sign-language-translator/sign-language-translator")
    print("  FastAPI: https://fastapi.tiangolo.com/")
    print("  MediaPipe: https://mediapipe.dev/")
    print() 