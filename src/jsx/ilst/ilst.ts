import { dispatchTS } from "../utils/utils";

export const saveDocument = () => {
  try {
    // Check if document is open
    if (!app.documents.length) {
      return { ok: true, message: "No document open" };
    }

    const doc = app.activeDocument;

    // Check if document has changes
    if (!doc.saved) {
      doc.save();
      return { ok: true, message: "Document saved successfully" };
    } else {
      return { ok: true, message: "No changes to save" };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // throw new Error(`Save error: ${errorMessage}`);
    return { ok: false, error: errorMessage };
  }
};

export const getDocumentInfo = () => {
  if (!app.documents.length) {
    return { exists: false, name: "", saved: true };
  }

  const doc = app.activeDocument;
  return {
    exists: true,
    name: doc.name,
    saved: doc.saved,
  };
};
