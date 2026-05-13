# CodePad Python Extensions
# Auto-injected to provide dump() function for visualizing objects

import json
import sys
from typing import Any, Optional


def dump(obj: Any, label: Optional[str] = None) -> Any:
    """
    Dump an object with formatted output.
    Similar to C#'s .Dump() extension method.

    Args:
        obj: Object to dump
        label: Optional label to display before output

    Returns:
        The original object (for chaining)
    """
    # Output label if provided
    if label:
        print(f"=== {label} ===")

    # Handle different types
    if obj is None:
        print("null")
    elif isinstance(obj, str):
        # Strings print directly (no JSON encoding)
        print(obj)
    elif isinstance(obj, (int, float, bool)):
        # Primitives print directly
        print(obj)
    elif isinstance(obj, (list, tuple)):
        # Arrays/lists - check if array of dicts (becomes table)
        if len(obj) > 0 and all(isinstance(item, dict) for item in obj):
            # Array of objects - serialize as JSON (will render as table)
            try:
                print(json.dumps(obj, indent=2, default=str))
            except Exception as e:
                print(f"[Dump Error: {e}]")
                print(obj)
        else:
            # Regular array
            try:
                print(json.dumps(obj, indent=2, default=str))
            except Exception as e:
                print(f"[Dump Error: {e}]")
                print(obj)
    elif isinstance(obj, dict):
        # Dictionary - serialize as JSON
        try:
            print(json.dumps(obj, indent=2, default=str))
        except Exception as e:
            print(f"[Dump Error: {e}]")
            print(obj)
    elif hasattr(obj, '__dict__'):
        # Objects with __dict__ - convert to dict and serialize
        try:
            obj_dict = obj.__dict__
            print(json.dumps(obj_dict, indent=2, default=str))
        except Exception as e:
            print(f"[Dump Error: {e}]")
            print(obj)
    else:
        # Fallback - try JSON, else string representation
        try:
            print(json.dumps(obj, indent=2, default=str))
        except Exception:
            print(str(obj))

    # Blank line for section separation
    print()

    # Return object for chaining
    return obj


# Alias for convenience
d = dump
