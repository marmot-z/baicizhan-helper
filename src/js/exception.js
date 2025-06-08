(function(global) {
  'use strict';

  class AccessDeniedException extends Error{
    constructor(message) {
      super(message);
      this.message = message;
    }
  }
  
  global.AccessDeniedException = AccessDeniedException;
}) (this);