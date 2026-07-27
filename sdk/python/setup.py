from setuptools import setup, find_packages

setup(
    name="apipoints-compute",
    version="1.0.0",
    description="APIPOINTS Compute SDK — Daytona sandbox execution with governance & metering",
    author="APIPOINTS",
    author_email="francis@loadcircle.co.uk",
    url="https://github.com/myloadcircle/apipoints",
    packages=find_packages(),
    install_requires=["httpx>=0.27.0"],
    python_requires=">=3.9",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Topic :: Software Development :: Libraries",
    ],
)
