#!/usr/bin/env python3
"""
IAMGREATER License Key Generator
Generates offline cryptographically-verified license keys for ChopTorch (CT-*) and QuickDraw (QD-*).
"""
import argparse
import hashlib
import hmac
import random
import string
import sys

SALT = "IAMGREATER_SOVEREIGN_2026_KEY"

def generate_key(prefix: str, custom_seed: str = None) -> str:
    prefix = prefix.upper().strip()
    if custom_seed:
        # Derive 8 alphanumeric chars from custom seed (e.g. customer email)
        h = hashlib.sha256(custom_seed.lower().strip().encode()).hexdigest().upper()
        code = h[:8]
    else:
        # 8 random chars from non-ambiguous set
        alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
        code = "".join(random.choice(alphabet) for _ in range(8))

    sig = hmac.new(SALT.encode(), f"{prefix}:{code}".encode(), hashlib.sha256).hexdigest()[:4].upper()
    return f"{prefix}-{code[:4]}-{code[4:8]}-{sig}"

def verify_key(prefix: str, full_key: str) -> bool:
    prefix = prefix.upper().strip()
    clean = full_key.upper().strip().replace("-", "").replace(" ", "")
    if not clean.startswith(prefix) or len(clean) < len(prefix) + 8:
        return False
    code = clean[len(prefix):-4]
    sig = clean[-4:]
    expected = hmac.new(SALT.encode(), f"{prefix}:{code}".encode(), hashlib.sha256).hexdigest()[:4].upper()
    return sig == expected

def main():
    parser = argparse.ArgumentParser(description="Generate IAMGREATER License Keys")
    parser.add_argument("--app", choices=["CT", "QD", "choptorch", "quickdraw"], default="CT", help="App prefix (CT or QD)")
    parser.add_argument("--count", type=int, default=10, help="Number of keys to generate")
    parser.add_argument("--email", type=str, help="Generate deterministic key for specific email")
    parser.add_argument("--verify", type=str, help="Verify a key")
    parser.add_argument("--export", type=str, help="Export keys to text file")

    args = parser.parse_args()

    prefix = "CT" if args.app.upper() in ["CT", "CHOPTORCH"] else "QD"

    if args.verify:
        is_valid = verify_key(prefix, args.verify)
        print(f"Key: {args.verify} -> {'VALID ✓' if is_valid else 'INVALID ✗'}")
        sys.exit(0 if is_valid else 1)

    if args.email:
        k = generate_key(prefix, args.email)
        print(f"Key for {args.email}: {k}")
        sys.exit(0)

    keys = [generate_key(prefix) for _ in range(args.count)]
    print(f"--- Generated {len(keys)} {prefix} License Keys ---")
    for k in keys:
        print(k)

    if args.export:
        with open(args.export, "w") as f:
            for k in keys:
                f.write(k + "\n")
        print(f"Exported to {args.export}")

if __name__ == "__main__":
    main()
