export class AppendQueue {
  constructor(sourceBuffer) {
    this.sourceBuffer = sourceBuffer;
    this.queue = [];
    this.currentOperation = null;
    this.failed = false;

    sourceBuffer.addEventListener("update", () => {
      if (this.currentOperation) {
        this.currentOperation.status = "success";
      }
    });

    sourceBuffer.addEventListener("error", () => {
      if (this.currentOperation) {
        this.currentOperation.status = "error";
      }
    });

    sourceBuffer.addEventListener("abort", () => {
      if (this.currentOperation) {
        this.currentOperation.status = "abort";
      }
    });

    sourceBuffer.addEventListener("updateend", () => {
      this.handleUpdateEnd();
    });
  }

  append(data) {
    return new Promise((resolve, reject) => {
      if (this.failed) {
        reject(new Error("Append queue has failed."));
        return;
      }

      this.queue.push({ data, resolve, reject });
      this.processNext();
    });
  }

  processNext() {
    if (
      this.failed ||
      this.currentOperation ||
      this.sourceBuffer.updating ||
      this.queue.length === 0
    ) {
      return;
    }

    const operation = this.queue.shift();

    this.currentOperation = {
      ...operation,
      status: "pending",
    };

    try {
      this.sourceBuffer.appendBuffer(operation.data);
    } catch (error) {
      this.currentOperation = null;
      this.failed = true;

      operation.reject(error);
      this.rejectRemaining(error);
    }
  }

  handleUpdateEnd() {
    const operation = this.currentOperation;

    // An operation may have finished outside our queue.
    // If so, check whether our queued work can now proceed.
    if (!operation) {
      this.processNext();
      return;
    }

    this.currentOperation = null;

    if (operation.status !== "success") {
      const error = new Error(`Append failed: ${operation.status}`);

      this.failed = true;
      operation.reject(error);
      this.rejectRemaining(error);
      return;
    }

    operation.resolve();
    this.processNext();
  }

  rejectRemaining(error) {
    while (this.queue.length > 0) {
      const operation = this.queue.shift();
      operation.reject(error);
    }
  }
}
