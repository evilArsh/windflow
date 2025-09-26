# 前端

# 性能优化

性能监控工具

[https://github.com/getsentry/sentry-javascript](https://github.com/getsentry/sentry-javascript)

# 知识点

---

## JavaScript 相关

---

- JS 表达式

  ```tsx
  let a = {};
  console.log((a["Arsh"] = 1)); //?
  ```

- 可迭代协议和迭代器协议

  1. [https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Iteration_protocols](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Iteration_protocols)
  
- JS 原型链

  [https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Inheritance_and_the_prototype_chain](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)

  ```jsx
  function Person() {
    //构造函数
    this.name = "hanzichi";
    this.age = 10;
  }
  Person.prototype.show = function () {
    console.log(this.name);
  };
  Person.prototype.sex = "male";
  /*
  每个原型都有一个constructor属性和__proto__
  
  Person.prototype:
  {
   show: ƒ ()
   constructor: ƒ Person()
   __proto__: Object
  }
  */
  var a = {};
  a.__proto__ = Person.prototype;
  Person.call(a); // 执行构造函数第一行
  /*
  a.__proto__ :
  {
   sex: "male"
   show: ƒ ()
   constructor: ƒ Person()
   __proto__: Object
  }
  a.__proto__===Person.prototype //true
  a.__proto__===a.constructor.prototype //true
  Person.prototype 指向其 构造函数Person
  Person === Person.prototype.constructor //true
  */
  console.log(a.sex); // male
  a.show();
  
  function Foo() {}
  var a = new Foo();
  
  Function.prototype._proto_ === Object.prototype;
  Object.prototype._proto_ === null;
  
  const person = {
    isHuman: false,
    printIntroduction: function () {
      console.log(`My name is ${this.name}. Am I human? ${this.isHuman}`);
    },
  };
  const a = Object.create(person);
  a.__proto__ === person; //true
  a.constructor.prototype === a.__proto__; //false
  ```

  - 方法（`'function'`）是对象，方法的原型(Function.prototype)是对象。**对象具有属性：**`__proto__`，可称为**隐式原型**，一个对象的隐式原型指向**构造该对象的`构造函数的原型` ，**这也保证了实例能够访问**在构造函数原型中**定义的属性和方法

  - 方法（`'function'`）这个特殊的对象，除了和其他对象一样有上述`__proto__`属性之外，还有自己特有的属性——原型属性（`prototype`），这个属性是一个指针，指向一个对象，这个对象的用途就是包含所有实例共享的属性和方法（我们把这个对象叫做`原型对象`）。`原型对象`也有一个属性，叫做`constructor`，这个属性包含了一个指针，**指回原构造函数:**`Foo.prototype.constructor===Foo`。

  - `**对象的**` `__proto__` 指向**构造函数的原型对象**`foo.__proto__ === Foo.prototype`

  - `**函数的`\*\* `__proto__` 指向：`Person.__proto__ === Function.prototype` (函数也是对象)

  - 原型链指向图示

    [https://github.com/mqyqingfeng/blog/issues/2](https://github.com/mqyqingfeng/blog/issues/2)

    ![assets/prototype3.png](assets/prototype3.png)

    ![assets/prototype4.png](assets/prototype4.png)

    ![assets/prototype5.png](assets/prototype5.png)

    ![assets/DAB7.jpg](assets/DAB7.jpg)

  - 原型链拓展方法

    ```js
    function foo(){}
    foo.prototype = {
      foo_prop: "foo val"
    };
    function bar(){}
    var proto = new foo;
    proto.bar_prop = "bar val";
    bar.prototype = proto;
    var inst = new bar;
    console.log(inst.foo_prop);
    console.log(inst.bar_prop);
    ```

- JS 继承

  [https://github.com/mqyqingfeng/Blog/issues/16](https://github.com/mqyqingfeng/Blog/issues/16)

  - **原型链继承**

    ```javascript
    function Parent () {
        this.name = 'kevin';
    }
    Parent.prototype.getName = function () {
        console.log(this.name);
    }
    function Child () {
    }
    Child.prototype = new Parent();// assume p=newParent()
    var child1 = new Child();
    //child1.__proto__===Child.prototype //true child1.__proto__===p
    //***  Child.prototype.constructor==Parent
    console.log(child1.getName())
    ```

    - 问题：**引用类型的属性被所有实例共享，**上例中，多个`Child`实例会共享同一个`Parent`中的`name`属性

  - **借用构造函数**(经典继承)

    ```jsx
    function Parent () {
        this.names = ['kevin', 'daisy'];
    }
    
    function Child () {
        Parent.call(this);
    }
    
    var child1 = new Child();
    
    child1.names.push('yayu');
    
    console.log(child1.names); // ["kevin", "daisy", "yayu"]
    
    var child2 = new Child();
    
    console.log(child2.names); // ["kevin", "daisy"] 
    ```

    - 优点
      - 避免了引用类型的属性被所有实例共享
      - 可以在 Child 中向 Parent 传参
    - 缺点
      - 方法都在构造函数中定义，每次创建实例都会创建一遍方法。

  - **组合继承**（原型链继承和经典继承组合，常用的继承模式）

    ```javascript
    function Parent (name) {
        this.name = name;
        this.colors = ['red', 'blue', 'green'];
    }
    
    Parent.prototype.getName = function () {
        console.log(this.name)
    }
    
    function Child (name, age) {
    
        Parent.call(this, name);
    
        this.age = age;
    
    }
    
    Child.prototype = new Parent();
    Child.prototype.constructor = Child;
    
    var child1 = new Child('kevin', '18');
    
    child1.colors.push('black');
    
    console.log(child1.name); // kevin
    console.log(child1.age); // 18
    console.log(child1.colors); // ["red", "blue", "green", "black"]
    
    var child2 = new Child('daisy', '20');
    
    console.log(child2.name); // daisy
    console.log(child2.age); // 20
    console.log(child2.colors); // ["red", "blue", "green"]
    ```

    - 组合继承最大的缺点是会调用两次父构造函数。1.`Child.prototype = new Parent();` 2.`var child1 = new Child('kevin', '18');`

  - **寄生组合式继承**

    - 对组合继承的优化

      ```jsx
      //组合继承的方式
      Child.prototype = new Parent();
      Child.prototype.constructor = Child;
      //优化的方式
      var F = function () {};
      F.prototype = Parent.prototype;
      Child.prototype = new F(); //$1
      Child.prototype.constructor = Child;
      
      /*
      $1处的理解
      `new` 的原理:也就是对象a的隐式原型__proto__被指向了函数Foo的显式原型，通过call方法改变上下文指向对象a，这时Foo构造函数里面的属性全被a所有。
      
      var a = {};   
      a.__proto__ = Foo.prototype;  
      Foo.call(a);
      */
      ```

  - **原型式继承**
    - ES5 Object.create 的模拟实现，将传入的对象作为创建的对象的原型。包含引用类型的属性值始终都会共享相应的值，这点跟原型链继承一样。
  - **寄生式继承**

    - 创建一个仅用于封装继承过程的函数，该函数在内部以某种形式来做增强对象，最后返回对象。

      ```jsx
      function createObj(o) {
        var clone = Object.create(o);
        clone.sayName = function () {
          console.log("hi");
        };
        return clone;
      }
      ```

    - 缺点：跟借用构造函数模式一样，每次创建对象都会创建一遍方法。

- JS 闭包

  - 作用域
    - [https://github.com/mqyqingfeng/Blog/issues/3](https://github.com/mqyqingfeng/Blog/issues/3)
    - [https://github.com/kuitos/kuitos.github.io/issues/18](https://github.com/kuitos/kuitos.github.io/issues/18)
    - **作用域是指程序源代码中定义变量的区域。**
    - 作用域规定了如何查找变量，也就是确定当前执行代码对变量的访问权限。JavaScript 采用词法作用域(lexical scoping)，也就是静态作用域。
  - [https://github.com/mqyqingfeng/Blog/issues/9](https://github.com/mqyqingfeng/Blog/issues/9)

    ```tsx
    和大多数的现代化编程语言一样，JavaScript是采用词法作用域的，这就意味着函数的执行依赖于函数定义的时候所产生（而不是函数调用的时候产生的）的变量作用域。
    为了去实现这种词法作用域，JavaScript函数对象的内部状态不仅包含函数逻辑的代码，除此之外还包含当前作用域链的引用。
    函数对象可以通过这个作用域链相互关联起来，如此，函数体内部的变量都可以保存在函数的作用域内，这在计算机的文献中被称之为闭包。

    从技术的角度去将，所有的JavaScript函数都是闭包：他们都是对象，他们都有一个关联到他们的作用域链。
    绝大多数函数在调用的时候使用的作用域链和他们在定义的时候的作用域链是相同的，但是这并不影响闭包。
    当调用函数的时候闭包所指向的作用域链和定义函数时的作用域链不是同一个作用域链的时候，闭包become interesting。这种interesting的事情往往发生在这样的情况下： 当一个函数嵌套了另外的一个函数，外部的函数将内部嵌套的这个函数作为对象返回。
    一大批强大的编程技术都利用了这类嵌套的函数闭包，当然，javascript也是这样。可能你第一次碰见闭包觉得比较难以理解，但是去明白闭包然后去非常自如的使用它是非常重要的。

    通俗点说，在程序语言范畴内的闭包是指函数把其的变量作用域也包含在这个函数的作用域内，形成一个所谓的“闭包”，这样的话外部的函数就无法去访问内部变量。所以按照第二段所说的，严格意义上所有的函数都是闭包。

    需要注意的是：我们常常所说的闭包指的是让外部函数访问到内部的变量，也就是说，按照一般的做法，是使内部函数返回一个函数，然后操作其中的变量。这样做的话一是可以读取函数内部的变量，二是可以让这些变量的值始终保存在内存中。
    ```

  - **MDN：闭包是指那些能够访问自由变量的函数。自由变量是指在函数中使用的，但既不是函数参数也不是函数的局部变量的变量。**
  - 如果一个变量既**不是函数 Foo 的参数**，**也不是 Foo 定义的局部变量**，那这个变量相对于 Foo 函数来说就是一个自由变量，如果一个函数中在访问一个自由变量，那它就是一个闭包
  - > 即使创建它的上下文已经销毁，它仍然存在（比如，内部函数从父函数中返回
  - > 在代码中引用了自由变量
  - This combination of a function object and a scope (a set of variable bindings) in which the function’s variables are resolved is called a closure in the computer science literature.

    ```jsx
    var data = [];
    
    for (var i = 0; i < 3; i++) {
      data[i] = function () {
        //这里的i的作用域是整个for循环，该自由变量生命周期直到for循环结束，因此最终值为3
        console.log(i);
      };
    }
    data[0](); //3
    data[1](); //3
    data[2](); //3
    
    var data = [];
    for (var i = 0; i < 3; i++) {
      data[i] = (function (i) {
        //这里的i相对于即将return函数来说是个自由变量，生命周期对于即将return的函数为当前for的一次循环
        return function () {
          console.log(i);
        };
      })(i);
    }
    data[0](); //0
    data[1](); //1
    data[2](); //2
    ```

- JS 代码优化
  - [https://www.construct.net/en/blogs/construct-official-blog-1/write-low-garbage-real-time-761](https://www.construct.net/en/blogs/construct-official-blog-1/write-low-garbage-real-time-761)
  
- JS 事件循环，宏任务和微任务

- JS 语法

  - `module.exports/require` 和 `import/export`
- 数据双向绑定 MVVM

## css 相关

---

- scroll**,client**,offset(Width|Height|Left|Top)

  ![assets/fnUntitled2.png](assets/fnUntitled2.png)

- BFC 块级上下文

- https://blog.csdn.net/weixin_46124214/article/details/105875458)

- 精读：[https://github.com/ascoders/weekly/tree/v2](https://github.com/ascoders/weekly/tree/v2)

- 前端面试题目:[https://juejin.cn/post/6986436944913924103?utm_source=gold_browser_extension](https://juejin.cn/post/6986436944913924103?utm_source=gold_browser_extension)

# Vue3

1. 虚拟 DOM
  - [https://juejin.cn/post/6844903870229905422](https://juejin.cn/post/6844903870229905422)

2. Diff 算法

    - <https://github.com/snabbdom/snabbdom> **A virtual DOM library with focus on simplicity, modularity, powerful features and performance.**
    - [https://juejin.cn/post/7010594233253888013](https://juejin.cn/post/7010594233253888013) **深入浅出虚拟 DOM 和 Diff 算法，及 Vue2 与 Vue3 中的区别**
    - [https://github.com/ascoders/weekly/blob/v2/190.精读《DOM diff 原理详解》.md](https://github.com/ascoders/weekly/blob/v2/190.%E7%B2%BE%E8%AF%BB%E3%80%8ADOM%20diff%20%E5%8E%9F%E7%90%86%E8%AF%A6%E8%A7%A3%E3%80%8B.md)
    - [https://github.com/ascoders/weekly/blob/v2/192.精读《DOM diff 最长上升子序列》.md](https://github.com/ascoders/weekly/blob/v2/192.%E7%B2%BE%E8%AF%BB%E3%80%8ADOM%20diff%20%E6%9C%80%E9%95%BF%E4%B8%8A%E5%8D%87%E5%AD%90%E5%BA%8F%E5%88%97%E3%80%8B.md)
 
# WebAssembly


# WebGL

[https://medium.com/free-code-camp/how-to-use-webgl-shaders-in-webassembly-1e6c5effc813](https://medium.com/free-code-camp/how-to-use-webgl-shaders-in-webassembly-1e6c5effc813)

[https://guptanikhil.medium.com/part-ii-opengl-to-webassembly-with-react-8f15430ab6c6](https://guptanikhil.medium.com/part-ii-opengl-to-webassembly-with-react-8f15430ab6c6)

[https://codingtidbit.com/2019/08/24/bring-your-c-opengl-code-to-the-web/](https://codingtidbit.com/2019/08/24/bring-your-c-opengl-code-to-the-web/)

[https://emscripten.org/docs/porting/multimedia_and_graphics/OpenGL-support.html?highlight=gpu](https://emscripten.org/docs/porting/multimedia_and_graphics/OpenGL-support.html?highlight=gpu)

[https://juejin.cn/post/6854573219454844935
