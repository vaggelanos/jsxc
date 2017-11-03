import Identifiable from '../IdentifiableInterface'
import Storage from '../Storage'

export default class PersistentMap {

   private map = {};

   private key: string;

   private initialized = false; //@REVIEW ???

   constructor(private storage: Storage, ...identifier: string[]) {
      this.key = storage.generateKey.apply(storage, identifier);

      this.map = this.storage.getItem(this.key) || {};

      this.storage.registerHook(this.key, (newValue) => {
         this.map = newValue;
      });
   }

   public getAllKeys(): string[] {
      return Object.keys(this.map);
   }

   public get(id: string) {
      return this.map[id];
   }

   public set(id: string, value: any);
   public set(value: any);
   public set() {
      if (typeof arguments[0] === 'string') {
         let id = arguments[0];
         let value = arguments[1];

         this.map[id] = value;
      } else if (typeof arguments[0] === 'object' && arguments[0] !== null) {
         $.extend(this.map, arguments[0]);
      }

      this.save();
   }

   public empty() {
      this.map = {};

      this.save();
   }

   public remove(id: Identifiable);
   public remove(id: string);
   public remove() {
      let id;

      if (typeof arguments[0] === 'string') {
         id = arguments[0];
      } else if (typeof arguments[0].getId === 'function') {
         id = arguments[0].getId();
      } else {
         //@TODO error
         return;
      }

      delete this.map[id];

      this.save();
   }

   public delete() {
      this.initialized = false;
      this.map = {};

      this.storage.removeItem(this.key);
      this.storage.removeHook(this.key);
   }

   public registerHook(id: string, func: (newValue: any, oldValue: any, key: string) => void);
   public registerHook(func: (newValue: any, oldValue: any, key: string) => void);
   public registerHook() {
      if (typeof arguments[0] === 'string' && typeof arguments[1] === 'function') {
         let id = arguments[0];
         let func = arguments[1];

         this.storage.registerHook(this.key, function(newData, oldData) {
            if (newData && !oldData) {
               func(newData[id]);
            } else if (newData[id] !== oldData[id]) {
               func(newData[id], oldData[id]);
            }
         });
      } else {
         let func = arguments[0];

         this.storage.registerHook(this.key, func);
      }
   }

   public registerNewHook(func: (value: any, id: string) => void) {
      this.registerHook((newValue, oldValue) => {
         let newValueKeys = Object.keys(newValue || {});
         let oldValueKeys = Object.keys(oldValue || {});
         this.initialized = true;
         if (newValueKeys.length > oldValueKeys.length) {
            let newIds = newValueKeys.filter(id => oldValueKeys.indexOf(id) < 0);

            for (let newId of newIds) {
               func(newValue[newId], newId);
            }
         }
      });
   }

   public registerRemoveHook(func: (id: string) => void) {
      this.registerHook((newValue, oldValue) => {
         let newValueKeys = Object.keys(newValue || {});
         let oldValueKeys = Object.keys(oldValue || {});

         if (newValueKeys.length < oldValueKeys.length) {
            let removedIds = oldValueKeys.filter(id => newValueKeys.indexOf(id) < 0);

            for (let removedId of removedIds) {
               func(removedId);
            }
         }
      });
   }

   private save() {
      this.initialized = true;

      this.storage.setItem(this.key, this.map);
   }
}
