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
  let a = {}
  console.log((a["Arsh"] = 1)) //?
  ```

- 可迭代协议和迭代器协议
  1. [https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Iteration_protocols](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Iteration_protocols)

- JS 原型链

  [https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Inheritance_and_the_prototype_chain](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)

  ```jsx
  function Person() {
    //构造函数
    this.name = "hanzichi"
    this.age = 10
  }
  Person.prototype.show = function () {
    console.log(this.name)
  }
  Person.prototype.sex = "male"
  /*
  每个原型都有一个constructor属性和__proto__
  
  Person.prototype:
  {
   show: ƒ ()
   constructor: ƒ Person()
   __proto__: Object
  }
  */
  var a = {}
  a.__proto__ = Person.prototype
  Person.call(a) // 执行构造函数第一行
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
  console.log(a.sex) // male
  a.show()

  function Foo() {}
  var a = new Foo()

  Function.prototype._proto_ === Object.prototype
  Object.prototype._proto_ === null

  const person = {
    isHuman: false,
    printIntroduction: function () {
      console.log(`My name is ${this.name}. Am I human? ${this.isHuman}`)
    },
  }
  const a = Object.create(person)
  a.__proto__ === person //true
  a.constructor.prototype === a.__proto__ //false
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
    function foo() {}
    foo.prototype = {
      foo_prop: "foo val",
    }
    function bar() {}
    var proto = new foo()
    proto.bar_prop = "bar val"
    bar.prototype = proto
    var inst = new bar()
    console.log(inst.foo_prop)
    console.log(inst.bar_prop)
    ```

- JS 继承

  [https://github.com/mqyqingfeng/Blog/issues/16](https://github.com/mqyqingfeng/Blog/issues/16)
  - **原型链继承**

    ```javascript
    function Parent() {
      this.name = "kevin"
    }
    Parent.prototype.getName = function () {
      console.log(this.name)
    }
    function Child() {}
    Child.prototype = new Parent() // assume p=newParent()
    var child1 = new Child()
    //child1.__proto__===Child.prototype //true child1.__proto__===p
    //***  Child.prototype.constructor==Parent
    console.log(child1.getName())
    ```

    - 问题：**引用类型的属性被所有实例共享，**上例中，多个`Child`实例会共享同一个`Parent`中的`name`属性

  - **借用构造函数**(经典继承)

    ```jsx
    function Parent() {
      this.names = ["kevin", "daisy"]
    }

    function Child() {
      Parent.call(this)
    }

    var child1 = new Child()

    child1.names.push("yayu")

    console.log(child1.names) // ["kevin", "daisy", "yayu"]

    var child2 = new Child()

    console.log(child2.names) // ["kevin", "daisy"]
    ```

    - 优点
      - 避免了引用类型的属性被所有实例共享
      - 可以在 Child 中向 Parent 传参
    - 缺点
      - 方法都在构造函数中定义，每次创建实例都会创建一遍方法。

  - **组合继承**（原型链继承和经典继承组合，常用的继承模式）

    ```javascript
    function Parent(name) {
      this.name = name
      this.colors = ["red", "blue", "green"]
    }

    Parent.prototype.getName = function () {
      console.log(this.name)
    }

    function Child(name, age) {
      Parent.call(this, name)

      this.age = age
    }

    Child.prototype = new Parent()
    Child.prototype.constructor = Child

    var child1 = new Child("kevin", "18")

    child1.colors.push("black")

    console.log(child1.name) // kevin
    console.log(child1.age) // 18
    console.log(child1.colors) // ["red", "blue", "green", "black"]

    var child2 = new Child("daisy", "20")

    console.log(child2.name) // daisy
    console.log(child2.age) // 20
    console.log(child2.colors) // ["red", "blue", "green"]
    ```

    - 组合继承最大的缺点是会调用两次父构造函数。1.`Child.prototype = new Parent();` 2.`var child1 = new Child('kevin', '18');`

  - **寄生组合式继承**
    - 对组合继承的优化

      ```jsx
      //组合继承的方式
      Child.prototype = new Parent()
      Child.prototype.constructor = Child
      //优化的方式
      var F = function () {}
      F.prototype = Parent.prototype
      Child.prototype = new F() //$1
      Child.prototype.constructor = Child

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
        var clone = Object.create(o)
        clone.sayName = function () {
          console.log("hi")
        }
        return clone
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
    var data = []

    for (var i = 0; i < 3; i++) {
      data[i] = function () {
        //这里的i的作用域是整个for循环，该自由变量生命周期直到for循环结束，因此最终值为3
        console.log(i)
      }
    }
    data[0]() //3
    data[1]() //3
    data[2]() //3

    var data = []
    for (var i = 0; i < 3; i++) {
      data[i] = (function (i) {
        //这里的i相对于即将return函数来说是个自由变量，生命周期对于即将return的函数为当前for的一次循环
        return function () {
          console.log(i)
        }
      })(i)
    }
    data[0]() //0
    data[1]() //1
    data[2]() //2
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

# C/C++

1.

[Learn C++](https://www.learncpp.com/)

1. **历史：** **[https://blog.csdn.net/kingcat666/article/details/44984711](https://blog.csdn.net/kingcat666/article/details/44984711)**

2. 清位，置位，异或，左移，右移，逻辑取反，按位取反

3. **static_cast**
   1. ![assets/cxxuntitled](assets/cxxuntitled.png)

4. **const_cast**
   1. 将对象的const去除，使得其可以被修改

5. **dynamic_cast**
   1. ![assets/cxxuntitled%201.png](assets/cxxuntitled1.png)

   2. \*\*\*\* 尽量少使用转型操作，尤其是dynamic_cast，耗时较高，会导致性能的下降，尽量使用其他方法替代

6. **boost::implicit_cast的目的**
   1. down_cast和up_cast
   2. [https://www.cnblogs.com/youxin/p/4396349.html](https://www.cnblogs.com/youxin/p/4396349.html)

7. **顶层，底层const**
   1. 顶层：指针本身就是一个常量。
      1. int \* const foo=xx;
      2. 指针的指向不能改变，但是指针指向的对象的值可以改变
   2. 底层：指针所指的对象是一个常量。
      1. const int \* foo=xx;
      2. 指针的指向可以改变，但是指针指向的值不能改变

8. **const成员函数**
   1. int foo () **const：**函数体内不能修改类成员变量，如果要修改，要被修改的变量要加入关键字violate
   2. **const** int foo()：

9. **decltype**
   1. 从表达式中推断出类型

10. **explicit**
    1. 构造函数只能显式调用，不能隐式转换

11. **std::function**

12. **std::bind**
    1. **boost::bind** 会把实参拷贝一份，在某些情况下可能会延长某对象的生命周期，比如参数用shared_ptr,本来对象早应该析构了的，但是 bind函数中的shared_ptr会一直保留，这时可能需要weak_ptr：std::bind(&Foo::bar,std::weak_ptr<Foo>(shared_from_this());有时候我们需要“如果对象还活着，就调用它的成员函数，否则忽略之”的语意，

    2. 疑问：**1**.bind函数里面只有一个\_1,为啥wakDeleteCallback函数里面有两个形参**2**.bind拷贝的是实参类型，不是形参类型

       ![assets/cxxuntitled%202](assets/cxxuntitled%202.png)

13. **std::move**

14. **static_assert**
    1. **[https://www.cnblogs.com/guxuanqing/p/10618816.html](https://www.cnblogs.com/guxuanqing/p/10618816.html)**
    2. 其语法：**static_assert**(常量表达式，提示字符串)。如果第一个参数常量表达式的值为false，会产生一条编译错误，错误位置就是该**static_assert**语句所在行，第二个参数就是错误提示字符串。

15. **std::shared_ptr**
    1. ![assets/cxxuntitled%203](assets/cxxuntitled%203.png)

16. **std::unique_ptr**

17. **std::weak_ptr**

18. **std::make_shared**

19. **template<class T> enable_share_from_this**
    1. **[https://blog.csdn.net/caoshangpa/article/details/79392878](https://blog.csdn.net/caoshangpa/article/details/79392878)**

20. **移动构造函数，复制构造函数**

21. **前置声明**
    1. 避免头文件循环引用
    2. [https://blog.csdn.net/stockholmrobber/article/details/81161546](https://blog.csdn.net/stockholmrobber/article/details/81161546)
    3. 关于前置声明的一些优缺点
       1. [https://zh-google-styleguide.readthedocs.io/en/latest/google-cpp-styleguide/headers/](https://zh-google-styleguide.readthedocs.io/en/latest/google-cpp-styleguide/headers/)
       2. Google开源项目风格指南

22. **右值引用&&**
    1. **[https://www.cnblogs.com/qicosmos/p/4283455.html](https://www.cnblogs.com/qicosmos/p/4283455.html)**
    2. 在形参中**Foo**(**T&&t**)表示的值类型不确定，可能是左值可能是优右值，最终确定它的是**左**还是**右**值
       1. 因为依赖于初始化，可以用在**移动语义**和**完美转发**
    3. 引用折叠规则
       1. 所有右值引用折叠到右值引用上仍然是一个右值引用。（A&& && 变成 A&&）
       2. 所有的其他引用类型之间的折叠都将变成左值引用。 （A& & 变成 A&; A& && 变成 A&; A&& & 变成 A&）
       3. 例如**const auto &foo=右值引用，**最后foo推导为**foo & &&**,变成左值引用

23. **vector begin 与引用类型**
    1. ![assets/cxxuntitled%204](assets/cxxuntitled%204.png)

    2. **rt**是引用类型，对引用**rt**取地址(**&rt**)的结果为引用类型所引用的对象的真实地址 \***\*，foo.**begin()**，返回一个迭代器iterator,**iterator指向第一个元素的引用**，对引用**ite**取地址(**&(\*ite)\*\*)的结果就是第一个元素的真实地址

       ![assets/cxxuntitled%205](assets/cxxuntitled%205.png)

       ![assets/cxxuntitled%206](assets/cxxuntitled%206.png)

       ![assets/cxxuntitled%207](assets/cxxuntitled%207.png)

24. **std::copy**

25. **volatile**

26. **constexpr**
    1. 编译期函数
    2. 算术类型、引用和指针都属于字面值类型。某些类也是字面值类型，它们可能含有constexpr函数成员。自定义类Sales_item、IO库、string类型不属于字面值类型。尽管指针和引用可以定义成constexpr，但它们的初始值受到严格限制。一个constexpr指针的初始值必须是nullptr、0或存储于某个固定地址中的对象。
    3. **consterxpr**函数是指能用于常量表达式的函数。该函数要遵循几项约定：函数的返回类型及所有形参的类型都得是字面值类型，而且函数体中必须有且只有一条return语句
    4. **C++11**中**constexpr**函数所受到的限制较多，比如函数体通常只有一句return语句，函数体内既不能声明变量，也不能使用for语句之类的常规控制流语句

27. **noexcept (expression)**
    1. 这个版本逻辑比较简单，expression 表达式的结果会被转换成bool类型，当为true表示不抛出异常，false则有可能抛出异常。如果直接写上noexcept则表示不抛出异常。

28. **std::atexit**
    1. 注册一个函数，在程序终止时执行

29. **inline**
    1. **[https://blog.csdn.net/BjarneCpp/article/details/76044493](https://blog.csdn.net/BjarneCpp/article/details/76044493)**
    2. 该关键字一般放在函数的定义上，一般不放在声明上。如果在执行某个内联函数的时候，就在调用点展开这个函数的内容并执行，而不是去调用它（ 在大多数的机器上，调用函数都要做很多工作：调用前要先保存寄存器，并在返回时恢复，复制实参，程序还必须转向一个新位置执行）

30. **friend**

31. **thread_local**
    1. key word
    2. 如果一个对象是全局静态变量，所有的线程都可以访问，但是这个对象有个thread_local成员变量，是否针对于这个变量，每个线程都有一个自己的副本？但是该对象的其他变量却是共享的。

32. **指向成员变量的指针**
    1. [https://riptutorial.com/cplusplus/example/6997/pointers-to-member-variables](https://riptutorial.com/cplusplus/example/6997/pointers-to-member-variables)

33. **\_\_cplusplus**
    1. 对于实现了1998 C++标准或2003 C++标准的\_\_cplusplus的值为**199711L**。
    2. 对于实现了2011 C++标准的\_\_cplusplus的值为**201103L**。

34. **结构体内存对齐 lignment**
    1. **[https://blog.shengbin.me/posts/gcc-attribute-aligned-and-packed](https://blog.shengbin.me/posts/gcc-attribute-aligned-and-packed)**

    2. **”以4字节对齐为例，如果自身大小大于4字节，都以4字节整数倍为基准对齐“。**假如当前为char[9],那该数组的下一个数据类型如果需要对齐，如果需要填充的话应该是填充**3个字节(**9=4+4+1,多出一个，凑满4的倍数**)**后再继续放。~~假如是5的整数倍为基准的话，应该是填充1(9=5+4，少一个）个。~~

    3. 一般计算机的内存是以字节（byte，等于8bit）为最小单元的。内存地址相当于从0开始的字节偏移数。如果一个内存地址是N的倍数，我们就说它是N字节对齐的（N-byte aligned）。

    4. **data alignment**, **data structure padding**, **packing**.

    5. x86处理器，32位机子

       ![assets/cxxuntitled%208](assets/cxxuntitled%208.png)

    6. **[https://stackoverflow.com/questions/119123/why-isnt-sizeof-for-a-struct-equal-to-the-sum-of-sizeof-of-each-member](https://stackoverflow.com/questions/119123/why-isnt-sizeof-for-a-struct-equal-to-the-sum-of-sizeof-of-each-member)**

    7. **[https://en.wikipedia.org/wiki/Data_structure_alignment](https://en.wikipedia.org/wiki/Data_structure_alignment)**
       1. **“** An *n*byte aligned address would have a minimum of *log2(n)* least-significant zeros when expressed in [binary](https://en.wikipedia.org/wiki/Binary_numeral_system)“,个人理解：假如4字节对齐,**short** 占两个字节，为了对齐还需填充>=log2(n)个字节

    8. **[https://blog.csdn.net/suifengpiao_2011/article/details/47260085](https://blog.csdn.net/suifengpiao_2011/article/details/47260085)**

    9. **[http://c-faq.com/struct/align.esr.html](http://c-faq.com/struct/align.esr.html)**

35. **#progma**
    1. **[https://blog.csdn.net/lmhuanying1012/article/details/78549763](https://blog.csdn.net/lmhuanying1012/article/details/78549763)**

36. **值语义**
    1. **[https://blog.csdn.net/zhc_24/article/details/82156970](https://blog.csdn.net/zhc_24/article/details/82156970)**
    2. 值语义指的是对象的拷贝与元对象无关，就像拷贝int一样。C++的内置类型（bool/int/double/char）都是值语义，标准库里的complex<>,pair<>,vector<>,map<>等等也都是值语义，拷贝之后就与原对象脱离关系。

37. **POD类型**
    1. **[https://blog.csdn.net/u011475134/article/details/72900890](https://blog.csdn.net/u011475134/article/details/72900890)**

38. **Lambda表达式**
    1. 尾置返回类型 [https://www.jianshu.com/p/2d44dae53910](https://www.jianshu.com/p/2d44dae53910)
       1. **默认情况下，如果一个lambda中包含一个return之外的任何语句，编译器将假定此lambda的返回void**
       2. 如果Lambda内部出现 **(int i){if** **(i<0)** **return** **i;** **else** **return** **i;}** 将无法编译通过。必须通过尾置返回类型**(int i)->int{if** **(i<0)** **return** **i;** **else** **return** **i;}**

    2. [var1,var2,&var3](){}

    3. [&](形参){}

    4. [&]{} 隐式捕获外部的变量，以引用的方式来捕获,Lambda内部使用的外部的变量都是以引用的方式使用的；即Lambda内部修改变量值之后外部也会跟着改变。如果引用的变量是一个**const**,Lambda内部就不可以修改

    5. [=]{} 以传值的方式来捕获
       1. 值捕获时，被捕获的值是创建时拷贝Lambda，而不是调用时拷贝；意思就是如果int a=10;在捕获时，就已经确定了该值为10，即使在函数外部修改了这个值Lambda表达式内部的值还是10

    6. 可变Lambda

       ![assets/cxxuntitled%209](assets/cxxuntitled%209.png)

39. **cin和printf绑定问题，效率问题**
    1. [https://blog.csdn.net/tczxw/article/details/46801935](https://blog.csdn.net/tczxw/article/details/46801935)
    2. **static** **auto** io_sync_off = [](){ ios::sync_with_stdio(false); cin.tie(nullptr); **return** nullptr; }();

40. **虚析构函数**

41. **CTRTP(奇异递归模板模式）**

42. **回调相关,bind,functional,**
    1. **[https://bot-man-jl.github.io/articles/?post=2019/Inside-Cpp-Callback](https://bot-man-jl.github.io/articles/?post=2019/Inside-Cpp-Callback)**
    2. chromium的设计 [https://github.com/chromium/chromium/blob/master/docs/callback.md](https://github.com/chromium/chromium/blob/master/docs/callback.md)
    3. "根据可调用次数，Chromium 把回调分为两种",**一次**和**多次。**在设计回调函数的时候，应该考虑到该回调函数的调用次数因素。

43. **Pimpl Idiom /handle body idiom**
    1. **[https://www.cnblogs.com/youxin/p/4300797.html](https://www.cnblogs.com/youxin/p/4300797.html)**
    2. ~~在类A需要include类B的时候，可以A的头文件中不包含类B而是定义一个**B的私有指针变量**（incomplete type 常用方式，也常用于解决循环引用的问题），再在A的cpp文件中include类B。使用这种方式的场景是如果B改动了，因为A B 是强耦合的，所以A也要重新编译。~~
    3. 另外一种情况就是A向外部提供公共接口，B作为A的内部类提供实现，除非A提供了新的公共方法，那么只需要变动B

44. **内存屏障**
    1. 只看引用 [https://blog.csdn.net/mw_nice/article/details/84861651](https://blog.csdn.net/mw_nice/article/details/84861651)
    2. **[https://www.zhihu.com/question/24301047](https://www.zhihu.com/question/24301047)**
    3. **[https://www.cnblogs.com/haippy/p/3412858.html](https://www.cnblogs.com/haippy/p/3412858.html)**

45. **单例Singleton**
    1. 关键字：**Meyer's Singleton，**此方法在c++03不是线程安全的 If control enters the declaration concurrently while the variable is being initialized, the concurrent execution shall wait for completion of the initialization.，
    2. **[https://zhuanlan.zhihu.com/p/37469260](https://zhuanlan.zhihu.com/p/37469260)**
    3. 双重校验锁的缺陷： [https://www.cnblogs.com/zxh1210603696/p/4157294.html](https://www.cnblogs.com/zxh1210603696/p/4157294.html) 简单来说就是对象的构造和临界值的判断没有同步

46. **cache命中 ，CPU缓存**
    1. [https://blog.csdn.net/chengti1867/article/details/100702477](https://blog.csdn.net/chengti1867/article/details/100702477)
    2. 思考：vector与cache之间的关系（看别人说vector是缓存亲和的）

47. **多线程**
    1. **Callable Object 可调用对象**
       1. ![assets/cxxuntitled%2010](assets/cxxuntitled%2010.png)

    2. 使用一个 能访问局部变量的函数去创建线程是一个糟糕的主意(除非十分确定线程会在函数完成前结束)。

    3. **std::join()**
       1. ![assets/cxxuntitled%2011](assets/cxxuntitled%2011.png)

    4. **std::detach()**
       1. 分离线程，使之在后台运行。守护线程

    5. **错误相关**
       1. **errno**
       2. **~~EOF~~**
          1. 文件结束符
       3. **stderr**
          1. 标准错误流
          2. 相关：**stdin，stdout**
       4. **std::perror(const char\* msg)**
          1. 将error的错误输出到stderr
       5. **std::strerror(int erronum)**
          1. 返回给定错误代码的文本版本
          2. eg: std::strerror(ENOENT)=>no such file or directory

    6. **可重入锁和不可重入锁**
       1. **[https://www.cnblogs.com/dj3839/p/6580765.html](https://www.cnblogs.com/dj3839/p/6580765.html)**
       2. 不可重入锁：**自旋锁。**如果线程在调用一个方法时获得了一把锁，如果另一个线程再次尝试执行这个方法并获取这把锁时，将会被阻塞，只能等到之前的锁被释放才能继续执行。
       3. 可重入锁： 一个线程中可以多次获取同一把锁，比如：一个线程在执行一个带锁的方法，该方法中又调用了另一个需要相同锁的方法，则该线程可以直接执行调用的方法，而无需重新获得锁；
          1. 如果是在**自旋锁**的情况下一个线程同时调用两次lock,就会产生死锁（在第一个lock还没释放时调用第二个lock，这时第二个lock会阻塞，但是第一个lock释放需要第二个lock先释放）

    7. **std::unique_lock**

48. **Linux pthread相关**
    1. int **pthread_once**(pthread_once_t *once_control, void (*init_routine) (void));
       1. 本函数使用初值为PTHREAD_ONCE_INIT的once_control变量保证init_routine()函数在本进程执行序列中仅执行一次。
       2. **once_control** must point to a **static** or **extern variable initialized to PTHREAD_ONCE_INIT**.

49. **STL/模板元编程相关**
    1. effective modern c++

    2. exceptional c++

    3. **SFINAE**:Substitution Failure Is Not An Error
       1. ![assets/cxxuntitled%2012](assets/cxxuntitled%2012.png)

       2. 当 **Foo**中**has函数不存在**时，第**7行**失效，第**9行**中**test<T>(0)不会匹配**7或者8从而**sizeof为0**，正好可以由此判断Foo中是否存在一个函数或者变量

       3. [https://en.m.wikipedia.org/wiki/Substitution_failure_is_not_an_error](https://en.m.wikipedia.org/wiki/Substitution_failure_is_not_an_error)

    4. 运行时错误转变为编译时错误
       1. 模板是在编译期确定的

       2. ![assets/cxxuntitled%2013](assets/cxxuntitled%2013.png)

       3. **typedef** **char** type_must_be_complete[ **sizeof**(T)? 1: -1 ];

       4. 定义了一个固定大小的char型数组，数组名为type_must_be_complete，数组大小是是sizeof(T)?1:-1。即typedef了一个大小为1的char型数组，否则定义一个大小为-1的数组。数组大小还能为负数？当然不能，于是就会报错，而且是**编译期错误**，于是就将一个动态运行时错误在编译时就发现了。

       5. **sizeof** 返回0的情况。 C/C++语言本身似乎没有这种情况，但有些编译器会作一些扩展，比如GCC对于incomplete type使用sizeof时，会返回0.那什么又叫做incomplete type呢，就是那些声明了，但没有定义的类型。 C++标准允许通过一个 delete 表达式删除指向不完全类的指针。如果该类有一个**非平凡的析构函数**，或者有一个**类相关的 delete 操作符**，那么其行为就是无定义的。因此编译器作了这种扩展，以将这种未定义的行为转为编译期错误，帮助程序员们及早发现

       6. **nontrival非平凡析构函数：**析构函数里面会做一些处理，比如释放**指针成员变量**

    5. RTTI机制

    6. 全特化

    7. 偏特化
       1. 给模板参数指定确切的类型

    8. 图灵完备

    9. 丘奇数

    10. **concept**
        1. c++20

    11. 类型推理
        1. [https://www.jianshu.com/p/1832a457f6cd](https://www.jianshu.com/p/1832a457f6cd)

    12. 函数类型

    13. **typeid**
        1. **[http://c.biancheng.net/view/2301.html](http://c.biancheng.net/view/2301.html)**
        2. 获取类型信息
        3. 返回一个**type_info** 类型对象
        4. eg: int n =1 **=>** typeid(n).name()=**int** 

    14. **decltype**

    15. **type_traits**
        1. **[https://blog.csdn.net/zxc024000/article/details/79405869](https://blog.csdn.net/zxc024000/article/details/79405869)**

        2. ![assets/cxxuntitled%2014](assets/cxxuntitled%2014.png)

        3. **std::is_const<T>::value**

        4. **std::is_same<T,T1>::value**
           1. 判断类型是否相同

        5. **std::common_type<bool,T,F>**
           1. 在编译期根据**bool**选择类型是**T**还是**F**

        6. **std::result_of**

        7. **std::enable_if**

        8. **std::decay**

        9. **std::remove_reference<T>::type**

![image-20220815110041372](assets/image-20220815110041372.png)

- freeswitch 基本配置
  - https://qi777.cn/archives/freeswitch%E5%AE%89%E8%A3%85%E9%83%A8%E7%BD%B2#1%E5%B8%B8%E8%A7%84%E9%85%8D%E7%BD%AE
  - https://blog.p2hp.com/archives/8419

# 命令

## 外部命令

| 命令作用            | 命令                |
| ------------------- | :------------------ |
| 启动freeswitch      | freeswitch          |
| 关闭freeswitch      | freeswitch shutdown |
| 后台启动 freeswitch | freeswitch -nc      |
| 关闭后台freeswitch  | freeswitch -stop    |
| 查询自己公网IP      | curl ifconfig.me    |

## fs_cli内部命令

| 命令作用 | 命令 |
| --- | --- |
| 显示在线用户 | show registrations |
| 查看通道 | show channels |
| 显示多少用户已注册 | sofia status profile internal reg |
|  | sofia status profile internal |
| 详细日志开关 | sofia profile internal siptrace on<br />sofia profile external siptrace on<br />sofia profile global siptrace on<br />sofia global siptrace on<br />sofia loglevel all 9 |
| 重新加载XML | F6 |
| 重启日志模块 | reload mod_logfile |
| 开启调试模式 | F8 或者 console loglevel debug |
| 模拟 给分机号拨打 &echo 程序 | originate user/8888 &echo |
| 模拟 用A分机打给B分机 | originate user/A B |
| 模拟 ？ | originate user/A B XML default |
| 测试正则表达式 | regex 1234 \| ^\d+$ |
|  |  |

# 用户

## 用户配置目录

```
默认用户目录：/usr/local/freeswitch/conf/directory/default
分机号规则修改：/usr/local/freeswitch/conf/dialplan/default.xml
默认密码修改：/usr/local/freeswitch/conf/vars.xml
```

# 录音配置

```
mkdir /usr/local/freeswitch/recordings/archive
vim /usr/local/freeswitch/conf/dialplan/default.xml
<extension name="Local_Extension">

<action application="set" data="RECORD_TITLE=Recording ${destination_number} ${caller_id_number} ${strftime(%Y-%m-%d %H:%M)}"/>
<action application="set" data="RECORD_COPYRIGHT=(c) 2011"/>
<action application="set" data="RECORD_SOFTWARE=FreeSWITCH"/>
<action application="set" data="RECORD_ARTIST=FreeSWITCH"/>
<action application="set" data="RECORD_COMMENT=FreeSWITCH"/>
<action application="set" data="RECORD_DATE=${strftime(%Y-%m-%d %H:%M)}"/>
<action application="set" data="RECORD_STEREO=true"/>
<action application="record_session" data="$${base_dir}/recordings/archive/${strftime(%Y-%m-%d-%H-%M-%S)}_${destination_number}_${caller_id_number}.wav"/>
```

# 日志

## 日志配置

```
code /usr/local/freeswitch/conf/autoload_configs/logfile.conf.xml
reload mod_logfile
```

## 关键日志记录

```
2022-08-15 11:12:26.251774 98.13% [NOTICE] mod_signalwire.c:401 Go to https://signalwire.com to set up your Connector now! Enter connection token 819cff0f-34df-4253-b7dd-146e3838adff
2022-08-15 11:12:26.251774 98.13% [INFO] mod_signalwire.c:1125 Next SignalWire adoption check in 6 minutes


2022-08-15 13:56:19.400830 98.17% [ERR] switch_stun.c:900 STUN Failed! [Timeout]
2022-08-15 13:56:19.400830 98.17% [ERR] switch_xml.c:175 stun-set failed.
2022-08-15 13:56:19.660828 98.17% [INFO] switch_stun.c:897 External ip address detected using STUN: 139.155.29.134
2022-08-15 13:56:19.700841 98.17% [INFO] mod_enum.c:887 ENUM Reloaded
2022-08-15 13:56:19.700841 98.17% [INFO] switch_time.c:1430 Timezone reloaded 1750 definitions



EXECUTE [depth=0] sofia/internal/1234@10.0.0.11 set(open=true)
2022-08-15 14:02:44.040835 99.03% [DEBUG] mod_dptools.c:1685 SET sofia/internal/1234@10.0.0.11 [open]=[true]
EXECUTE [depth=0] sofia/internal/1234@10.0.0.11 log(CRIT WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING )
2022-08-15 14:02:44.040835 99.03% [CRIT] mod_dptools.c:1879 WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING
EXECUTE [depth=0] sofia/internal/1234@10.0.0.11 log(CRIT Open /usr/local/freeswitch/conf/vars.xml and change the default_password.)
2022-08-15 14:02:44.040835 99.03% [CRIT] mod_dptools.c:1879 Open /usr/local/freeswitch/conf/vars.xml and change the default_password.
EXECUTE [depth=0] sofia/internal/1234@10.0.0.11 log(CRIT Once changed type 'reloadxml' at the console.)
2022-08-15 14:02:44.040835 99.03% [CRIT] mod_dptools.c:1879 Once changed type 'reloadxml' at the console.
EXECUTE [depth=0] sofia/internal/1234@10.0.0.11 log(CRIT WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING )
2022-08-15 14:02:44.040835 99.03% [CRIT] mod_dptools.c:1879 WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING


2022-08-15 16:26:27.618354 98.77% [WARNING] sofia_reg.c:3223 Can't find user [100@10.0.0.11] from 45.134.144.163
You must define a domain called '10.0.0.11' in your directory and add a user with the id="100" attribute



[ERR] mod_signalwire.c:393 Curl Result 28, Error: Failed to connect to adopt.signalwire.com port 443: Connection timed out

```

# 安装

~~export https_proxy=http://139.155.29.134:65530 && export http_proxy=http://139.155.29.134:65530~~

![image-20230108134001446](assets/image-20230108134001446.png)

```
为了快速安装，请翻墙，要clone很多仓库,而且仓库比较大
fs / pat_d75WcmtKg4L8hJVTDVnB6iRV

https://qi777.cn/archives/freeswitch%E5%AE%89%E8%A3%85%E9%83%A8%E7%BD%B2#5%E6%BA%90%E7%A0%81%E5%AE%89%E8%A3%85%E6%8E%A8%E8%8D%90

apt install subversion build-essential autoconf automake libtool libncurses5 libncurses5-dev make libjpeg-dev libtool libtool-bin libsqlite3-dev libpcre3-dev libspeexdsp-dev libldns-dev libedit-dev yasm liblua5.2-dev libopus-dev cmake libcurl4-openssl-dev libexpat1-dev libgnutls28-dev libtiff5-dev libx11-dev unixodbc-dev libssl-dev python-dev zlib1g-dev libasound2-dev libogg-dev libvorbis-dev libperl-dev libgdbm-dev libdb-dev uuid-dev libsndfile1-dev libavformat-dev libswscale-dev libpq-dev -y

git clone https://github.com/signalwire/freeswitch.git -b v1.10.7

cd /usr/local/src
git clone https://github.com/signalwire/libks.git -b release
git clone https://github.com/signalwire/signalwire-c.git
cmake .
make
make install
export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig:/usr/local/lib64/pkgconfig:${PKG_CONFIG_PATH}
{
 centos ld 错误：yum -y install *atomic*
}
cd freeswitch
git clone https://github.com/freeswitch/sofia-sip.git && cd sofia-sip
./bootstrap.sh -j
./configure && make && make install
yasm/nasm
git clone https://github.com/freeswitch/spandsp.git
./bootstrap.sh -j
./configure && make && make install
export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig:${PKG_CONFIG_PATH}

{
centos7 https://github.com/NLnetLabs/ldns 新版本
}
ldconfig
export PKG_CONFIG_PATH=/usr/lib64:/usr/lib:/usr/local/lib/pkgconfig:/usr/local/lib64/pkgconfig:${PKG_CONFIG_PATH}
cd freeswitch
./bootstrap.sh
./configure && make && make install

make cd-sounds-install && make cd-moh-install

ln -sf /usr/local/freeswitch/bin/freeswitch /usr/bin/
ln -sf /usr/local/freeswitch/bin/fs_cli /usr/bin/

export http_proxy=http://139.155.29.134:65530 && export https_proxy=https://139.155.29.134:65530
git config --global https.proxy '139.155.29.134:65530'
git config --global http.proxy '139.155.29.134:65530'
git config --global --unset http.proxy
git config --global --unset https.proxy
fs_cli -H 127.0.0.1 -P 5038 -p 123 Mje7hCjd78???
```

```shell
centos
# 关闭防火墙
systemctl stop firewalld
systemctl disable firewalld

# 关闭SELINUX
sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config
setenforce 0

# 安装依赖包
yum install -y git alsa-lib-devel autoconf automake bison broadvoice-devel bzip2 curl-devel libdb4-devel e2fsprogs-devel erlang flite-devel g722_1-devel gcc-c++ gdbm-devel gnutls-devel ilbc2-devel ldns-devel libcodec2-devel libcurl-devel libedit-devel libidn-devel libjpeg-devel libmemcached-devel libogg-devel libsilk-devel libsndfile-devel libtheora-devel libtiff-devel libtool libuuid-devel libvorbis-devel libxml2-devel lua-devel lzo-devel mongo-c-driver-devel ncurses-devel net-snmp-devel openssl-devel opus-devel pcre-devel perl perl-ExtUtils-Embed pkgconfig portaudio-devel postgresql-devel python-devel python-devel soundtouch-devel speex-devel sqlite-devel unbound-devel unixODBC-devel wget which yasm zlib-devel libshout-devel libmpg123-devel lame-devel rpm-build libX11-devel libyuv-devel

# 安装cmake
yum remove cmake -y
yum install libatomic -y
#进入操作目录,可随意指定，我一般习惯将源码放在这个目录。
cd /usr/local/src
wget https://cmake.org/files/v3.14/cmake-3.14.7.tar.gz
tar -xzvf cmake-3.14.7.tar.gz
cd cmake-3.14.7
#编译
./configure && make && make install

# 安装libks
cd /usr/local/src
git clone git://github.com/signalwire/libks.git -b release
cd libks
#编译
cmake .
make && make install

# 安装signalwire-c
cd /usr/local/src
git clone git://github.com/signalwire/signalwire-c.git
cd signalwire-c/
#编译
cmake .
make && make install

ln -sf /usr/local/lib64/pkgconfig/signalwire_client.pc /usr/lib64/pkgconfig/signalwire_client.pc

# 安装nasm
cd /usr/local/src
wget https://www.nasm.us/pub/nasm/releasebuilds/2.13.03/nasm-2.13.03.tar.gz
tar -xzvf nasm-2.13.03.tar.gz
cd nasm-2.13.03/
#编译
./configure
make && make install

# 安装x264
cd /usr/local/src
#下载速度比较慢，可通过迅雷下载压缩包的方式下载。
git clone https://code.videolan.org/videolan/x264.git
cd x264/
#编译
./configure --disable-asm
make && make install

# 安装libav
{ 最新的freeswitch可能需要高版本的libav 'AVStream' has no member named 'codecpar'
https://github.com/libav/libav/tree/v12.3
}
cd /usr/local/src
wget http://download1.rpmfusion.org/free/el/updates/7/x86_64/x/x264-libs-0.148-24.20170521gitaaa9aa8.el7.x86_64.rpm
wget http://download1.rpmfusion.org/free/el/updates/7/x86_64/x/x264-devel-0.148-24.20170521gitaaa9aa8.el7.x86_64.rpm
rpm -hiv x264-libs-0.148-24.20170521gitaaa9aa8.el7.x86_64.rpm
rpm -hiv x264-devel-0.148-24.20170521gitaaa9aa8.el7.x86_64.rpm
git clone https://gitee.com/nwaycn/libav.git
cd libav
#编译
./configure --enable-pic --enable-shared  --enable-libx264 --enable-gpl --extra-libs="-ldl"
make && make install

# Install spandsp
cd /usr/local/src
git clone git://github.com/freeswitch/spandsp.git
cd spandsp
./bootstrap.sh -j
./configure && make && make install

# Install sofia-sip
cd /usr/local/src
git clone git://github.com/freeswitch/sofia-sip.git
cd sofia-sip
./bootstrap.sh -j
./configure && make && make install

export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig
ldconfig



# 安装Freeswitch
cd /usr/local/src/
wget https://files.freeswitch.org/releases/freeswitch/freeswitch-1.10.6.-release.tar.gz
tar -zxf freeswitch-1.10.6.-release.tar.gz


cd /usr/local/src/freeswitch-1.10.6.-release
# 进行编译
./devel-bootstrap.sh
./configure #--enable-core-pgsql-support

# 避免安装失败，打开下面的文件
vim /usr/local/src/freeswitch-1.10.6.-release/src/mod/codecs/mod_opus/Makefile
# 注释文件最后面的下面 install 和 all 这两行
# Comment line 896 & 897
#install: error
#all: error

make -j
make install

# 配置freeswitch可以在任意目录执行
ln -sf /usr/local/freeswitch/bin/freeswitch /usr/bin/
ln -sf /usr/local/freeswitch/bin/fs_cli /usr/bin/
```

## 额外插件

- https://github.com/fusionpbx/fusionpbx-install.sh
  - ```
    wget -O - https://raw.githubusercontent.com/fusionpbx/fusionpbx-install.sh/master/debian/pre-install.sh | sh;
    cd /usr/src/fusionpbx-install.sh/debian && ./install.sh


    Installation Notes.

       Please save the this information and reboot this system to complete the install.

       Use a web browser to login.
          domain name: https://10.0.0.11
          username: admin
          password: amkUigoU9xRHFTfTbY2rDmLSWSY

       The domain name in the browser is used by default as part of the authentication.
       If you need to login to a different domain then use username@domain.
          username: admin@10.0.0.11

       Official FusionPBX Training
          Fastest way to learn FusionPBX. For more information https://www.fusionpbx.com.
          Available online and in person. Includes documentation and recording.

          Location:               Online
          Admin Training:          TBA
          Advanced Training:       TBA
          Continuing Education:   https://www.fusionpbx.com/training
          Timezone:               https://www.timeanddate.com/weather/usa/idaho

       Additional information.
          https://fusionpbx.com/members.php
          https://fusionpbx.com/training.php
          https://fusionpbx.com/support.php
          https://www.fusionpbx.com
          http://docs.fusionpbx.com
    ```

- Fail2Ban
  - ```
    sudo apt install fail2ban

    # 设置开机启动
    systemctl enable fail2ban
    # 启动
    systemctl start fail2ban
    ```

# 变量

## 全局变量

```
进入fs_cli
1. eval $${}
2. global_getvar xx
      hostname
      local_ip_v4
      local_mask_v4
      local_ip_v6
      switch_serial
      base_dir
      recordings_dir
      sound_prefix
      sounds_dir
      conf_dir
      log_dir
      run_dir
      db_dir
      mod_dir
      htdocs_dir
      script_dir
      temp_dir
      grammar_dir
      certs_dir
      storage_dir
      cache_dir
      core_uuid
      zrtp_enabled
      nat_public_addr
      nat_private_addr
      nat_type
```

# 配置

```
https://download.linphone.org/releases/android/

/usr/local/freeswitch/conf/directory/default 中存有用户配置

```

- stun 服务器的默认选择
  - ```
    conf/vars.xml
    <X-PRE-PROCESS cmd="stun-set" data="external_sip_ip=stun:stun.freeswitch.org"/>
    ```

  -

# DialPlan

## 查看通道变量

```
<extension name="Show Channel Variable">
	<!-- 测试IP地址 -->
	<condition field="network_addr" expression="^192\.168\.7\.7$">
    <condition field="destination_number" expression="^1235|info$">
        <action application="info" data=""/>
    </condition>
</extension>
```

## Condition 测试条件

- `<condition field="测试条件字段" expression="^192\.168\.7\.7$">`
-

# PostgreSQL

https://blog.51cto.com/u_908405/1950318

## `vars.xml`

- ```
  <X-PRE-PROCESS cmd="set" data="default_password=z5wn3cSe0zvq"/>
  <X-PRE-PROCESS cmd="set" data="default_pgsqlpwd=Se0zvqZ5wn3c???"/>
  <X-PRE-PROCESS cmd="set" data="default_pgsqluser=postgresarsh"/>
  <X-PRE-PROCESS cmd="set" data="default_pgsqldb=freeswitch"/>

  <!-- pgsql -->
  <X-PRE-PROCESS cmd="set" data="dsn=pgsql://hostaddr=127.0.0.1 dbname=$${default_pgsqldb} user=$${default_pgsqluser} password='$${default_pgsqlpwd}' options='-c client_min_messages=NOTICE' application_name='freeswitch'" />

  <X-PRE-PROCESS cmd="set" data="dsn_callcenter=pgsql://hostaddr=127.0.0.1 dbname=$${default_pgsqldb} user=$${default_pgsqluser} password='$${default_pgsqlpwd}' options='-c client_min_messages=NOTICE' application_name='freeswitch'" />
  ```

## `dialplain/default.xml`

- ```
  <action application="set" data="recording_file=$${recordings_dir}/${caller_id_number}.${strftime(%Y-%m-%d-%H-%M-%S)}.wav"/>
  ```

## `autoload_configs/switch.conf.xml`

- `<param name="core-db-dsn" value="pgsql://hostaddr=127.0.0.1 dbname=freeswitch user=postgrearsh password='Se0zvqZ5wn3c???' options='-c client_min_messages=NOTICE'" />`

## `autoload_configs/cdr_pg_csv.conf.xml`

- ```
  <param name="db-info" value="host=localhost user=postgrearsh password=Se0zvqZ5wn3c??? dbname=freeswitch connect_timeout=10" />
  <param name="db-table" value="xml_cdr"/>
  ```

  - ```postgresql
    CREATE TABLE "public"."xml_cdr" (
    "uuid" uuid NOT NULL,
    "domain_uuid" uuid,
    "extension_uuid" uuid,
    "domain_name" text COLLATE "default",
    "accountcode" text COLLATE "default",
    "direction" text COLLATE "default",
    "default_language" text COLLATE "default",
    "context" text COLLATE "default",
    "xml_cdr" text COLLATE "default",
    "json" jsonb,
    "caller_id_name" text COLLATE "default",
    "caller_id_number" text COLLATE "default",
    "source_number" text COLLATE "default",
    "destination_number" text COLLATE "default",
    "start_epoch" numeric,
    "start_stamp" timestamp(6),
    "answer_stamp" timestamp(6),
    "answer_epoch" numeric,
    "end_epoch" numeric,
    "end_stamp" text COLLATE "default",
    "duration" numeric,
    "mduration" numeric,
    "billsec" numeric,
    "billmsec" numeric,
    "bridge_uuid" text COLLATE "default",
    "read_codec" text COLLATE "default",
    "read_rate" text COLLATE "default",
    "write_codec" text COLLATE "default",
    "write_rate" text COLLATE "default",
    "remote_media_ip" text COLLATE "default",
    "network_addr" text COLLATE "default",
    "recording_file" text COLLATE "default",
    "leg" char(1) COLLATE "default",
    "pdd_ms" numeric,
    "rtp_audio_in_mos" numeric,
    "last_app" text COLLATE "default",
    "last_arg" text COLLATE "default",
    "cc_side" text COLLATE "default",
    "cc_member_uuid" uuid,
    "cc_queue_joined_epoch" text COLLATE "default",
    "cc_queue" text COLLATE "default",
    "cc_member_session_uuid" uuid,
    "cc_agent" text COLLATE "default",
    "cc_agent_type" text COLLATE "default",
    "waitsec" numeric,
    "conference_name" text COLLATE "default",
    "conference_uuid" uuid,
    "conference_member_id" text COLLATE "default",
    "digits_dialed" text COLLATE "default",
    "pin_number" text COLLATE "default",
    "hangup_cause" text COLLATE "default",
    "hangup_cause_q850" numeric,
    "sip_hangup_disposition" text COLLATE "default",
    CONSTRAINT "xml_cdr_pkey" PRIMARY KEY ("uuid")
    )
    WITH (OIDS=FALSE);

    ALTER TABLE "public"."xml_cdr" OWNER TO "postgresarsh";
    ```

  - ```
        <field var="uuid"/>
        <field var="domain_uuid"/>
        <field var="domain_name"/>
        <field var="accountcode"/>
        <field var="direction"/>
        <field var="default_language"/>
        <field var="context"/>
        <field var="xml_cdr"/>
        <!-- <field var="local_ip_v4"/> -->
        <field var="caller_id_name"/>
        <field var="caller_id_number"/>
        <field var="destination_number"/>
        <field var="start_epoch"/>
        <field var="start_stamp"/>
        <field var="answer_stamp"/>
        <field var="answer_epoch"/>
        <field var="end_epoch"/>
        <field var="end_stamp"/>
        <field var="duration"/>
        <field var="mduration"/>
        <field var="billsec"/>
        <field var="billmsec"/>
        <field var="bridge_uuid"/>
        <!-- <field var="bleg_uuid"/> -->
        <field var="read_codec"/>
        <field var="read_rate"/>
        <field var="write_codec"/>
        <field var="write_rate"/>
        <field var="remote_media_ip"/>
        <field var="network_addr"/>
        <field var="recording_file"/>
        <field var="leg"/>
        <field var="pdd_ms"/>
        <field var="last_app"/>
        <field var="last_arg"/>
        <field var="cc_side"/>
        <field var="cc_member_uuid"/>
        <field var="cc_queue_joined_epoch"/>
        <field var="cc_queue"/>
        <field var="cc_member_session_uuid"/>
        <field var="cc_agent"/>
        <field var="cc_agent_type"/>
        <field var="waitsec"/>
        <field var="conference_name"/>
        <field var="conference_uuid"/>
        <field var="conference_member_id"/>
        <field var="digits_dialed"/>
        <field var="hangup_cause"/>
        <field var="hangup_cause_q850"/>
        <field var="sip_hangup_disposition"/>
        <!-- <field var="sip_hangup_disposition"/> -->
        <!-- <field var="ani"/> -->
      </schema>
    ```

  -

# 编解码

```
show codec
```

## SDP协商

https://blog.csdn.net/yetyongjin/article/details/88848897

# ESLl

## 外连outbound

`FreeSwitch`连接到外部TCP Server，收到请求后发送给外部TCP Server，外部TCP Server发送控制命令指示FreeSwitch`该怎么做

### 外联样例

- 拨打电话到`1234`，`fs`会接收`38086`端口发来的命令，并且执行
  - ```
    // diaplan/default.xml
    // async 异步
    // full 允许使用全部api
    <extension name="socket">
        <condition field="destination_number" expression="^1234">
        <action application="socket" data="127.0.0.1:38086 async full"/>
        </condition>
    </extension>
    ```

  - nc 操作，监听`38086`端口
    - `nc -l -k 0.0.0.0 38086`

    - ```shell
      connect 连接

      //播放音乐
      sendmsg
      call-command: execute
      execute-app-name: playback
      execute-app-arg: local_stream://moh

      //挂断
      sendmsg
      call-command: execute
      execute-app-name: hungup
      execute-app-arg: local_stream://moh

      //接通
      sendmsg
      call-command: execute
      execute-app-name: answer
      event-lock: false

      ```

    -

## 内连inbound

外部`TCP client` 连接`FreeSwitch`，监听各种事件，`TCP Client`收到这些事件后，可以通过执行`App`和`API`来控制FreeSWITCH的行为

### 内连样例

- 配置IP:PORT `conf/autoload_configs/event_socket.conf.xml`

- 可以在`event_socket.conf.xml`中直接配置ip限制，推荐在`acl.conf.xml`配置

- 失败总结：
  - `Access Denied, go away`

  - `<param name="listen-ip" value="::"/>` 改为 `<param name="listen-ip" value="0.0.0.0"/>`

  - 在`autoload_configs/acl.conf.xml`中,自定义acl
    - ```
      <list name="colorful" default="deny">
          <node type="allow" cidr="10.0.0.11/22"/>
          <node type="allow" cidr="127.0.0.1/8"/>
          <node type="allow" cidr="61.189.128.0/18"/>
      </list>

      event_socket.conf.xml
          <param name="apply-inbound-acl" value="colorful"/>
      ```

    - `reloadacl` `reload mod_event_socket` `f6`

- ```
  nc localhost 8021

  auth <password>

  api version
  api status
  api sofia status
  api uptime
  api originate user/8888 &echo
  ```

- 订阅事件
  - ```
    event [plain|xml|json] ALL
    ```

## 命令/事件

### api

> ```
> api <command> <arg>
> ```

- 阻塞模式，FreeSWITCH在api 命令完成执行之前不会接受任何新命令

- ```
  api originate sofia/mydomain.com/ext@yourvsp.com 1000   # connect sip:ext@yourvsp.com to extension 1000

  api msleep 5000
  ```

### bgapi

> ```
> bgapi <command> <arg>
> ```

- 非阻塞模式，后台执行任务，执行结果将作为一个带有指定 UUID 的**事件**发送，UUID 用于标识对指定事件的回复

- 需要监听 <font color="#ff9900">BACKGROUND_JOB</font> 事件
  - https://freeswitch.org/confluence/display/FREESWITCH/Event+List

  - ```
    //监听事件
    event plain BACKGROUND_JOB
    filter Event-Name BACKGROUND_JOB HEARTBEAT
    //执行命令
    bgapi originate user/8888 &echo

    //fs响应
    Content-Type: command/reply
    Reply-Text: +OK Job-UUID: e5076691-4fec-40cd-b222-7611a1cfd6e3
    Job-UUID: e5076691-4fec-40cd-b222-7611a1cfd6e3

    //命令完成，fs响应
    Content-Length: 638
    Content-Type: text/event-plain

    Event-Name: BACKGROUND_JOB
    Core-UUID: 696972a4-b44a-44f7-b8c9-55c1b5e441b3
    FreeSWITCH-Hostname: VM-0-11-ubuntu
    FreeSWITCH-Switchname: VM-0-11-ubuntu
    FreeSWITCH-IPv4: 10.0.0.11
    FreeSWITCH-IPv6: %3A%3A1
    Event-Date-Local: 2022-09-07%2011%3A42%3A45
    Event-Date-GMT: Wed,%2007%20Sep%202022%2003%3A42%3A45%20GMT
    Event-Date-Timestamp: 1662522165644334
    Event-Calling-File: mod_event_socket.c
    Event-Calling-Function: api_exec
    Event-Calling-Line-Number: 1572
    Event-Sequence: 18307
    Job-UUID: e5076691-4fec-40cd-b222-7611a1cfd6e3
    Job-Command: originate
    Job-Command-Arg: user/8888%20%26echo
    Content-Length: 41

    +OK af7f68e6-c5c6-4db3-83e2-508ea9b15609
    ```

  -

### linger/nolinger

- 当一个channel挂断之后，freeswitch直到socket client接收到与通道相关的最后一个事件后才<font color="#ff0000">关闭</font>

### 事件

- https://freeswitch.org/confluence/display/FREESWITCH/Event+List

- 对事件的重复监听不会覆盖之前已经监听了的事件
- 事件由**header**和可**选body**部分组成，二者由一行隔开；**header**格式为**key/value**,**body**部分有可能还有原始数据格式，**不一定是key/value形式**

#### myevent

> myevents <`uuid`>
>
> myevents plain|json|xml <uuid>

- **myevents** 订阅可以使**内连(inbound)**拥有类似**外连(outbound)**的行为。只会监听特定**uuid**的事件，其它事件会被忽略；当**channel** 消失时会<font color="#ff0000">关闭</font>socket；或者当**socket**断开连接并且所有**applications** 都完成执行时<font color="#ff0000">关闭</font>**channel**

#### divert_events

> divert_events on/off

- 捕获inputCallback产生的回调函数（默认情况下用户按键产生的inputcallback事件只能被嵌入式脚本的回调函数捕获）；嵌入式脚本通过setInputCallback()注册inputcallback事件，将divert_events 设置为“on”可用于聊天消息，gtalk channel、ASR 事件等。

#### filter

> ```
> filter <EventHeader> <ValueToFilter>
> ```

- 只**监听**过滤后的事件，不是过滤掉,当是使用过滤器后，仅接收过滤后的事件，可以执行多次

- eg:
  - ```
    events plain|json|xml all

    //回复
    Content-Type: command/reply
    Reply-Text: +OK event listener enabled plain

    //只监听HEARTBEAT事件
    filter Event-Name HEARTBEAT ...

    Content-Type: command/reply
    Reply-Text: +OK filter added. [Event-Name]=[HEARTBEAT]

    filter plain all
    filter plain CUSTOM conference::maintenance
    //监听指定channel
    filter Unique-ID $participantB
    filter Unique-ID $participantA
    filter Unique-ID $participantC
    filter call-direction Inbound
    filter Event-Calling-File mod_conference.c
    //监听会议
    filter Conference-Unique-ID $ConfUUID
    ```

> ```
> filter delete <EventHeader> <ValueToFilter>
> ```

- ```
  filter delete Event-Name HEARTBEAT
  filter delete Unique-ID d29a070f-40ff-43d8-8b9d-d369b2389dfe
  //删除所有基于uuid的监听
  filter delete Unique-ID
  ```

#### sendevent

> ```
> sendevent <event-name>
> <headers>
>
> <body>
> ```

- 消息头和消息体之间用两个回车换行符`\r\n\r\n`隔开。

- 有些电话需要身份验证才能发出NOTIFY请求。如果为用户提供**反向身份验证凭据**，FreeSWITCH可以响应摘要质询(https://freeswitch.org/confluence/display/FREESWITCH/XML+User+Directory)

- **发送一条消息给一个分机号**；`host`字段为`Freeswitch`主机
  - ```
    sendevent SEND_MESSAGE
    profile: internal
    content-type: text/plain
    user: 8888
    host: 10.0.0.11
    content-length: 2

    ok
    --------------以下没生效--------------
    sendevent NOTIFY
    profile: internal
    content-type: application/simple-message-summary
    event-string: check-sync
    user: 8888
    host: 10.0.0.11
    content-length: 2

    ok
    ```

#### sendmsg

> ```
> sendmsg <UUID>
> <headers>
>
> <body>
> ```

- **execute**
  - ```
    sendmsg <uuid>
    call-command: execute
    execute-app-name: <one of the applications>
    execute-app-arg: <application data>
    loops: <number of times to invoke the command, default: 1>
    content-length: <content length> //可选

    <application data>
    --------------
    sendmsg <uuid>
    call-command: execute
    execute-app-name: playback
    execute-app-arg: /tmp/test.wav
    ```

  - ```
    sendmsg
    call-command: set
    execute-app-name: foo=bar\n\n
    event-lock:true
    ```

- **hangup**
  - ```
    sendmsg <uuid>
    call-command: hangup
    hangup-cause: <one of the causes listed below>
    ```

#### nixevent

> nixevent <event types | ALL | CUSTOM custom event sub-class>

#### 其他

```
exit
auth <password>
log <level>
nolog
nixevent <event types | ALL  | CUSTOM custom event sub-class> //除了某件事件外的所有事件
noevents
```

### ESL中事件和过滤器逻辑梳理

- 如果`filter Event-name <EVENT>`执行时没有`event json <EVENT>`，则`<EVENT>`不会被过滤
- 当 filter 开启之后，暂时没有关闭的办法，只有断开socket后重新连接
- 执行 `noevents`后，filter不会有事件通知，filter的事件必须已订阅

# 其它

```
/etc/cloud/cloud.cfg.dpkg-new 配置cloud环境（如：禁止root登录）
/etc/cloud/templates/hosts.debian.tmpl
```

## NAT与SIP

### 情况1：client 在NAT中，FreeSwitch在公网中

- **假设FreeSwitch不会智能处理`Contact`中携带的内网`IP:PORT`,并且SIP client 也不会使用STUN获取真实`IP:PORT`**
  - 如果SIP client IP=`192.168.0.2`

  - 路由器NAT外网IP=`1.2.3.4`

  - 公网中FreeSwitch IP=`1.2.3.4.5` ，client注册的REGISTER信息为：
    - ```
      REGISTER sip:1000@1.2.3.5 SIP/2.0
      Contact: <sip:1000@192.168.0.2:5060>
      ```

  - **SIP话机向FreeSWITCH注册是为了让FreeSWITCH记住自己的`Contact`地址,其他client可以通过该地址与其通信**。根据`Contact`字段信息：FreeSWITCH在收到请求后会认为该消息是从`192.168.0.2:5060`发出

- 该消息是从`192.168.0.2:5060` 发出，NAT设备对该`IP:PORT`进行了网络地址转换后为`1.2.3.4:65535`。但因为`FreeSwitch`和`SIP client`都不智能，`FreeSwitch`就会以为`SIP client (也可以称为UAC)`的通讯地址是`192.168.0.2:5060`，这样会导致其他用户打不通该用户

- 解决方法：
  - `FreeSWITCH`作为一个服务器是`可以`知道该`SIP client`的NAT映射后的`ip:port`的（即SIP包的来源地址），即`1.2.3.4:65535`，记住该地址就行。
  - `SIP client` 发送数据报给STUN服务器（考虑到各种NAT类型，这个STUN服务应该集成到`FreeSwitch`中`switch_stun.c`），通过一系列交互获取到了出口地址`1.2.3.4:65535`，写入`Contact`中发送`REGISTER`即可。

### 情况2：SIP通，RTP不通

- 通了但没声音，或者单通，只有一方有声音

- 这种情况与`SDP`中的描述信息有关：
  - | 字段 | 作用 |
    | :-: | --- |
    | v= | Version，表示协议的版本号 |
    | o= | Origin，表示源。值域中各项（以空格分隔）的涵义依次是username（用户名）、sess-id（会话ID）、sess-version（会话版本号）、nettype（网络类型）、addrtype（地址类型）、unicast-address（单播地址）。 |
    | s= | Session Name，表示本SDP所描述的Session的名称。 |
    | **c=** | **Connecton Data，连接数据。其中值域中以空格分配的两个字段分别是网络类型和网络地址，以后的RTP流就会发到该地址上。注意，在NAT环境中如果要解决RTP穿越问题就要看这个地址** |
    | b= | Badwidth Type，带宽类型。 |
    | t= | Timing，起止时间。0表示无限 |
    | m= | `m=audio 50452 RTP/AVP 8 0 98 101`<br />audio Media Type，媒体类型。audio表示音频，50452表示音频的端口号;RTP/AVP是传输协议；后面是支持的Codec类型，与RTP流中的Payload Type 相对应![image-20220817163437766](assets/image-20220817163437766.png)<br />在这里分别是8、0、98和101，8和0分别代表PCMA和PCMU，它们属于静态编码，因而有一一对应的关系，而对于大于95的编码都属于动态编码，需要在后面使用“a=rtpmap”进行说明。<br />8 PCMA<br />18 G729 |
    | a= | `a=rtpmap:98 ILBC/8000`<br />`a=rtpmap:101 telephone-event/8000`<br />`a=sendrecv`<br />`a=fmtp:101 0-15`<br />Attributes，属性。它用于描述上面音频的属性，如98代表8000Hz的ILBC编码，101代表RFC2833 DTMF事件。a=sendrecv表示该媒体流可用于收和发，其他的还有sendonly（仅收）、recvonly（仅发）和inactive（不收不发） |
    | v= | Viewo，视频 |
    |  |  |

  - 假设有以下描述信息：
    - ```
      INVITE 9196@1.2.3.5
      Content-Type: application/sdp
      c=IN IP4 192.168.0.2
      m=audio 50452 RTP/AVP 8 0 101
      ```

    - FreeSWITCH是无法向这个192.168.0.2发送RTP包，这个问题可以由客户端通过STUN服务解决，也可以由FreeSWITCH端解决

#### SIP穿越

- FreeSWITCH默认使用ACL来判断对方是否处于一个NAT环境中
  - `<param name="apply-nat-acl" value="nat.auto"/>` `sip_profiles/internal.xml`中
  - nat.auto是一个ACL，它包含RFC1918规定的私网地址，并去掉了本地网络的地址。`FS`根据`ACL`判断`Contact`中的地址是否是内网地址，并且替换成`SIP包来源地址,已经被NAT设备转换成了外网地址`。`Contact`字段中包含`fs_nat=yes`字段，并且替换的地址保存到`fs_path`字段中，以后任何时候FreeSWITCH向这个客户端发消息时，均使用fs_path指定的地址

#### RTP穿越

- 由于客户端的SDP信息中的IP地址是私网地址，因而FreeSWITCH无法直接给它发RTP包；很多NAT设备都只有内网的主机曾经向外网主机发过包以后，才允许外面的包进入（_大多是对称型NAT_）
- FreeSWITCH使用了一个名为RTP自动调整的特性，即**FreeSWITCH在SIP协商时给对方一个可用的公网RTP地址，然后等待客户端发送RTP包**，一旦它收到RTP包以后，就可以根据对方发包的地址给它发RTP包.
  - `[INFO] switch_rtp.c:4753 Auto Changing port from 192.168.1.124:50492 to 1.2.3.4:50492`
- 安全问题：因为需要`client`主动发送`RTP`包到`FreeSwitch`，然后`FreeSwitch`记录该地址后进行通信，如果黑客充当`client`猜测`FreeSwitch`开放的端口并发包成功，`FreeSwitch`发送的数据就会流转到黑客那里去。
  - 解决方法：FreeSWITCH为了防止这个问题，规定这种端口调整只能在电话开始的时候进行，一旦调整过，就不能再进行调整，调整默认开启：
    - `<param name="disable-rtp-auto-adjust" value="true"/>` `/conf/sip_profiles`
    - 或者只针对个别的呼叫来禁止自动调整，在呼叫时可以通过设置“rtp_auto_adjust=false”通道变量禁止

#### 其他解决方案

参见《FreeSWITCH 权威指南》9.4章节

## 开启一个模块

```
当已经安装好freeswitch，需要安装一个未安装的模块步骤

1.进入freeswitch-version源码目录

修改module.conf 启动你的安装的模块如mod_cdr_pg_csv

2.进入src/mod目录下，make mod_cdr_pg_csv

3.回到源码跟目录make mod_cdr_pg_csv-install
```

# 错误梳理

> 407 Proxy Authentication Required

`FreeSwitch ` 发出的 `Proxy Authentication` 是正常的，这样做是确保其他人无法从未授权的`UAC` 上发送 `INVITE`请求到`FreeSwitch`服务器。正确配置所有内容后，`UAC`应该再次发送一个带有身份验证凭据的`INVITE`请求

> 只有一边有声音

通常是防火墙或者NAT的原因。有可能是防火墙正在阻塞音频媒体传输。应该禁用路由器上的`ALG`功能，有些路由器上也叫做`SIP HELPER`。

排查数据包上的`SDP`信息

## 测试过程发现的问题

> 手机->电脑

服务器能收到手机发送的音频(并且生成录音文件)，但是电脑上无法接收，（服务器也能收到电脑发送的音频，手机端也无法接收）

> 台式发送的SDP描述信息分析

```
recv 1482 bytes from udp/[61.189.159.183]:2324 at 13:57:34.110673:
------------------------------------------------------------------------
》INVITE sip:9196@10.0.0.11 SIP/2.0
》Via: SIP/2.0/UDP 135.1.90.67:5060;branch=z9hG4bK.WQHPbttub;rport
》From: <sip:9527@10.0.0.11>;tag=MRESTxhPo
》To: sip:9196@10.0.0.11
》CSeq: 21 INVITE
》Content-Type: application/sdp
》Content-Length: 516
》Contact: <sip:9527@61.189.159.183:2324;transport=udp>;expires=600;+sip.instance="<urn:uuid:0e4d2cbb-4f84-00de-80d5-6f111bae7327>";+org.linphone.specs="ephemeral/1.1,groupchat/1.1,lime"
...
》o=9527 2033 2909 IN IP4 135.1.90.67
》c=IN IP4 135.1.90.67
》m=audio 7646 RTP/AVP 96 97 98 0 8 18 99 100 101
```

- 无：a=sendrecv（收发）|sendonly（仅收）| recvonly（仅发）| inactive（不收不发）

- `m= `中`RTP`端口号 `7646`，`o=`中`RTP`收发地址`135.1.90.67`。

- **最终`RTP`收发地址为 `135.1.90.67:7646`**，通过`Via`可知，该段`SDP`描述信息经过了地址(经过了该路由器/网关)`135.1.90.67:5060`。**`SIP`请求真正的出口地址是`61.189.159.183:2324`**；一个公网网关地址。

- `Contact`字段中的地址`61.189.159.183:2324`表示内网`UAC`地址映射到的公网网关的地址，`FreeSwitch`发送`SIP`消息到该地址，消息就能被转发到内网`UAC`，但是`RTP`不是

- **分析原因**
  - ```
    AUDIO RTP [sofia/internal/9527@10.0.0.11] 10.0.0.11 port 28468 -> 135.1.90.67 port 7646
    ```

    - <font color=#FF0000 >服务器的RTP包发送到了 135.1.90.67:7646上，但是这个地址前还有一个 61.189.159.183网关，因此电脑收不到RTP包</font>

  - `用户9527`最终的`RTP`地址`135.1.90.67:7646`

  - `FreeSwitch`最后发送了一次额外SDP协商
    - ```
      send 1150 bytes to udp/[61.189.159.183]:2324 at 13:57:34.131528:
      ------------------------------------------------------------------------
      》SIP/2.0 183 Session Progress
      》Via: SIP/2.0/UDP 135.1.90.67:5060;branch=z9hG4bK.WQHPbttub;rport=2324;received=61.189.159.183
      》From: <sip:9527@10.0.0.11>;tag=MRESTxhPo
      》To: <sip:9196@10.0.0.11>;tag=gggjUye35vBeB
      》Contact: <sip:9196@139.155.29.134:5060;transport=udp>
      》User-Agent: FreeSWITCH-mod_sofia/1.10.7-
      》Accept: application/sdp
      》Content-Type: application/sdp
      》Remote-Party-ID: "9196" <sip:9196@10.0.0.11>;party=calling;privacy=off;screen=no

      》o=FreeSWITCH 1662069786 1662069787 IN IP4 139.155.29.134
      》s=FreeSWITCH
      》c=IN IP4 139.155.29.134
      》t=0 0
      》m=audio 28468 RTP/AVP 96 99
      ```

    - 描述信息中表示`FreeSwitch开放了一个RTP地址 139.155.29.134:28468`。如果`UAC`向这个地址发送RTP包，服务器将会接收；
      - 猜测`FreeSwitch`通过`SIP/SDP`消息发现`UAC`处于`NAT`后面，然后启用了`RTP自动调整的特性`方案，主动开启一个端口让`UAC`发送`RTP`包，然后建立连接，但是`UAC`并没理会这个包，而是发送到了之前的`SDP`中描述的`RTP`地址；但是为什么服务器能收到`UAC`发送的音频？

    - `Cannot create outgoing channel of type [error] cause: [USER_NOT_REGISTERED]`
      - 这是什么意思

## 一次完整的通话记录（只有一方有声音）

> UAC：手机，电脑，均处于内网中;**电脑呼叫手机**

![image-20220906124252956](C:\Users\wxl\AppData\Roaming\Typora\typora-user-images\image-20220906124252956.png)

> 1.204.231.38 电脑9526 106.109.26.211 手机 8888

**电脑** -> **手机** <font color=#FF0000 >**手机到电脑没声音，电脑到手机有声音**</font>

**电脑-->服务器** 发送sip/sdp INVITE->8888 并且表明**电脑 RTP 1.204.231.38:<font color=#FF0000 >40546</font>** 1.204.231.38:38186 --> 10.0.0.11:5060

**服务器-->电脑** 407 Proxy Authentication Required **pc**再次发送sip/sdp invite 并附加头部：

```
Digest username="9526",
realm="10.0.0.11",
nonce="db1dc219-65f0-4e4f-abd6-1382b994023c",
uri="sip:8888@139.155.29.134:5060",
response="9678ed26a1b3716bb618cf21a31c2caa",
algorithm=MD5,
cnonce="7414bf70a4b8ad2cde49f0fb96c02e61",
qop=auth,
nc=00000405
```

并且**再次**表明 **RTP 1.204.231.38:<font color=#FF0000 >40546</font>** 1.204.231.38:38186 --> 10.0.0.11:5060

**服务器返回Trying 100** 10.0.0.11:5060 --> 1.204.231.38:38186

**服务器-->pc** 发送sip/sdp 183 Session Progress 并且表明**FreeSwitch RTP 10.0.0.11:<font color=#ff9900 >16778</font>** 10.0.0.11:5060 --> 1.204.231.38:38186

**服务器-->手机** 发送sip/sdp INVITE->8888 Session Progress 并且表明**FreeSwitch RTP 10.0.0.11:<font color=#dd11ff >16812</font>** 10.0.0.11:5060 --> 106.109.26.211:58880

**\*手机-->服务器 100 Trying** 106.109.26.211:58880 --> 10.0.0.11:5060

**电脑-->服务器** 发送RTP包 18个 第一个RTP包(Unknown RTP version 0) 接着 一个RTCP 106.107.26.211:40546 --> 10.0.0.11:16778

**\*手机-->服务器** 发送 SIP/SDP 183 Session Progress 并且表明 **手机 RTP 106.109.26.211:<font color=#00cee5 >58883</font>** 106.109.26.211:58880 --> 10.0.0.11:5060

--RTP 发送环节-- 手机:58883 --> 服务器:**<font color=#dd11ff >16812</font>** SSRC=_0x8A610C00_ Seq=5261手机:58883 --> 服务器:**<font color=#dd11ff >16812</font>** SSRC=_0x8A610C00_ Seq=5262

电脑:40546 --> 服务器:**<font color=#ff9900 >16778</font>** SSRC=<u>0x66440208</u> Seq=58664电脑:40546 --> 服务器:**<font color=#ff9900 >16778</font>** SSRC=<u>0x66440208</u> Seq=58665

服务器:16778 --> 电脑:**<font color=#FF0000 >40546</font>** SSRC=0xDF23454E Seq=19504

手机:58883 --> 服务器:**<font color=#dd11ff >16812</font>** SSRC=_0x8A610C00_ Seq=5263

电脑:40546 --> 服务器:**<font color=#ff9900 >16778</font>** SSRC=<u>0x66440208</u> Seq=58666电脑:40546 --> 服务器:**<font color=#ff9900 >16778</font>** SSRC=<u>0x66440208</u> Seq=58667

手机:58883 --> 服务器:**<font color=#dd11ff >16812</font>** SSRC=_0x8A610C00_ Seq=5264

服务器:16778 --> 电脑:**<font color=#FF0000 >40546</font>** SSRC=0xDF23454E Seq=19505服务器:16812 --> 手机:**<font color=#00cee5 >58883</font>** SSRC=0xEB2F03EE Seq=17037

--**wireshark中 RTP 数据流向**--

~~-- PC --> 服务器 --> 手机~~ PC:40456 --> 服务器:16778 服务器:16812 --> 手机:58883

~~-- 手机 --> 服务器 --> PC~~ 手机:58883 --> 服务器16812 服务器:16778 --> PC:40546

- 在一次wireshark抓包中，能抓到手机发送到电脑的**RTP**包，并且语音数据正常，目的端口就是**UAC**开启的**UDP端口**但是**电脑的UAC无法播放声音**，猜测音频解码器的原因,
- 在一次**手机 --> 手机** 通话中，软件为**linphone**和**Port SIP UC** 当双方的解码器都开启之后，就能够正常通话

# Log

![image-20230108154655260](assets/image-20230108154655260.png)

![image-20230108154836458](assets/image-20230108154836458.png)

<img src="assets/image-20230108164711699.png" alt="image-20230108164711699" style="zoom:200%;" />

iptables -t nat -A PREROUTING -p udp --dport 15060 -j REDIRECT --to-ports 5060

https://blog.csdn.net/nainaiqiuwencun/article/details/80697388

**报错You must install libopus-dev to build mod_opus. Stop. 但确实已经 yum 安装 libopus-dev 或 opus-devel 后依然报错：** ========删除opus，编译安装新版yum remove opus wget https://archive.mozilla.org/pub/opus/opus-1.3.1.tar.gz tar xvfz opus-1.3.1.tar.gz cd opus-1.3.1 ./configure make make install cp /usr/lib/pkgconfig/opus.\* /usr/lib64/pkgconfig/ cd /usr/local/src/freeswitch make clean ./configure … 重新配置以重新生成make文件make

https://codeantenna.com/a/aqXH4dKI06

Setting NAT mode based on websockets

fs Request Terminated 487 拒接

fs Temporarily Unavailable 480 未接听

asterisk (13047903212)603 未接听/拒接

asterisk 503 空号

https://blog.csdn.net/u012597310/article/details/104059611

# golang

# 命令

---

1. `go env`

- `go mod`

  ```
  download    download modules to local cache (下载依赖的module到本地cache))
  edit        edit go.mod from tools or scripts (编辑go.mod文件)
  graph       print module requirement graph (打印模块依赖图))
  init        initialize new module in current directory (再当前文件夹下初始化一个新的module, 创建go.mod文件))
  tidy        add missing and remove unused modules (增加丢失的module，去掉未用的module)
  vendor      make vendored copy of dependencies (将依赖复制到vendor下)
  verify      verify dependencies have expected content (校验依赖)
  why         explain why packages or modules are needed (解释为什么需要依赖)
  ```

1. `dlv debug xx.go` 调试程序
2. `dlv exec xx.exe` 调试go程序

- `go get`

  `-u` 更新package到最新版本

  `go -u=patch` 只更新小版本，例如从v1.2.4到v1.2.5

  [`github.com/xxxxx/xxxxx@master`](http://github.com/chromedp/chromedp@master) 获取/更新某个包

---

# channel使用场景

```go
go (func() {
		// ! sence 1
		// ! 如果channel 被关闭，该方式会无限循环，除非通过defer自动关闭channel
		// for {
		// 	select {
		// 	case str := <-strChn:
		// 		fmt.Printf("[read strChn] %b\n", str)
		// 	}
		// }

		// ! sence 2
		// ! 如果channel被关闭，for 不会执行，而是在发送端如果继续写channel会panic
		/*
		panic: send on closed channel
		panic: close of closed channel
		*/
		for x := range strChn {
			fmt.Printf("[read strChn] %b\n", x)
		}
	})()
```

## 关闭 channel的方法

- `sync.Once`
- `sync.Mutex`
- [如何优雅地关闭Go channel - 简书 (jianshu.com)](https://www.jianshu.com/p/d24dfbb33781)

# 语法

- `golang` 一些问题搜集

  [https://www.zhihu.com/question/311207855](https://www.zhihu.com/question/311207855)

# 经验

---

- Share memory by communicating; don't communicate by sharing memory.

- `net.Addr` 和 `*net.IPNet` 的关系

  `net.Addr` 为一个**`interface`** , `net.IPNet` 实现了它

  通过类型断言(**Type assertions**) `ipNet, ok := net.Addr.(*net.IPNet)` `ipNet` 为 `*net.IPNet` 指针实例

- `interface{}` 和 `nil` 配合使用

  当一个函数返回值`res`是`nil` 的时候用一个`interface{}` 类型去接收，则判断语句`res==nil` 为`false`

- `slice`作为函数实参，并且在函数内部对`slice`进行`append`操作时，

  [https://segmentfault.com/a/1190000012008869](https://segmentfault.com/a/1190000012008869)

```go
//使用方法
func SetFinalizer(obj interface{}, finalizer interface{})
```

## 循环变量和闭包的关系

```go
a := make([]func(), 3 )
for i := 0; i < 3; i++ {
    a[i]= func( ){
        fmt.Println(i)
    }
}
for _, s := range a {
    s()
}
//Golang打印结果为3 3 3
```

## `string` 和 `[]byte` 转换效率

---

```go
type StringHeader struct {
	Data uintptr
	Len  int
}
type SliceHeader struct {
	Data uintptr
	Len  int
	Cap  int
}
// SliceHeader 和 StringHeader 互相转化时内存布局会发生怎样的变化
```

## `interface`

---

## `select`

---

- 在返回channel之前做耗时操作可能会影响程序的正确逻辑，尤其是在case中调用函数，函数里面又有耗时操作的时候

  [https://zhuanlan.zhihu.com/p/91044663](https://zhuanlan.zhihu.com/p/91044663)

  > select语句在判断chan就绪之前，会把所有的case语句的判断语句先执行一遍，这包括在case语句中的函数调用

如果有多个channel就绪，select会随机选择一个执行，有可能会遇到某个case无法执行的情况

## `struct tag`

---

`Marshal` 和 `Unmarshal` 函数

- 代码样例

  ```go
  //关键字 field tag
  type Person struct {
      FirstName  string `json:"first_name"`
      // omitempty 表示 如果 MiddleName是zero-value 则序列化之后的Object不包括该filed
      MiddleName string `json:"middle_name,omitempty"`
      // - 表示序列化之后的JSON跳过该字段(不包括)
      Password   string `json:"-"`
  }
  type Foo struct {
  	Emial    string `json:"email" validate:"required,email"`
  	Password string `json:"passwrod" validate:"required"`
  }
  func Foo() {
  	type S struct {
  		F string `species:"gopher" color:"blue"`
  	}
  	s := S{}
  	st := reflect.TypeOf(s)
  	field := st.Field(0)
  	fmt.Println(field.Tag.Get("color"), field.Tag.Get("species"))
  }
  //reflect.StructTag.Get()
  ```

- 网站参考

  [Go语言中的strcut tag](https://zhuanlan.zhihu.com/p/32279896)

  [https://studygolang.com/articles/14469](https://studygolang.com/articles/14469)

## 并发非阻塞缓存设计

---

## 非阻塞队列设计

---

## 库收集

---

groupcache

# 分布式

---

## Paxos一致性算法

[https://www.jianshu.com/p/6d01a8d2df9f](https://www.jianshu.com/p/6d01a8d2df9f)

[https://darktea.github.io/notes/2013/05/26/paxos-made-simple.html](https://darktea.github.io/notes/2013/05/26/paxos-made-simple.html)

[https://www.zhihu.com/question/19787937](https://www.zhihu.com/question/19787937)

[http://drmingdrmer.github.io/tech/distributed/2015/11/11/paxos-slide.html](http://drmingdrmer.github.io/tech/distributed/2015/11/11/paxos-slide.html)

拜占庭将军问题

https://www.zhihu.com/people/guo-ya-xiang/posts Raft 共识算法

# 外部参考

[https://www.zhihu.com/question/64058225](https://www.zhihu.com/question/64058225)

[https://tonybai.com/2021/03/07/go-malware-round-up-2020/](https://tonybai.com/2021/03/07/go-malware-round-up-2020/)

[https://tonybai.com/2021/03/07/go-malware-round-up-2020/](https://tonybai.com/2021/03/07/go-malware-round-up-2020/)

`continuation`

[对 Go 语言的综合评价](http://www.yinwang.org/blog-cn/2014/04/18/golang)

https://www.cnblogs.com/457220157-FTD/p/14666852.html

# 其他

- 微信sdk

  [https://github.com/silenceper/wechat](https://github.com/silenceper/wechat)

- 官方微信支付sdk

  [https://github.com/wechatpay-apiv3/wechatpay-go](https://github.com/wechatpay-apiv3/wechatpay-go)

[https://developers.weixin.qq.com/](https://developers.weixin.qq.com/)

[https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_1.shtml](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_1.shtml)

# Gorm

## 结构体tag

当 struct 中的字段没有值时， `json.Marshal()` 序列化的时候不会忽略这些字段，而是默认输出字段的类型零值

1. int和float类型零值是 0
2. string类型零值是 ""
3. 对象类型零值是 nil

```go
type User struct {
  ID   int64
  Name string `gorm:"default:galeone"`
  Age  int64  `gorm:"default:18"`
	TableSchema  string `gorm:"column:TABLE_SCHEMA" json:"tableSchema"`
}

格式
`key1:"value1" key2:"value2"`

///////// json
`json:"-"` // 序列化/反序列化时忽略该字段
`json:"email,omitempty"` //忽略零值（默认不忽略）
{
	ID int64 `json:"id,string"` // 处理字符串数字
}

////////// gin
{
	// 该字段接收为Password 返回password
	// binding 搭配 form 使用,默认如果没查找到结构体中的某个字段则不报错值为空, binding为 required 代表没找到返回错误给前端
	Password string `form:"Password" json:"password" binding:"required"`
}

///////// gorm
type User struct {
  ID   int64
	// 数据库表名为name;长度128;默认值为galeone;主键;自增 json序列化名字name
  Name string `gorm:"column:name;size:128;default:galeone;primarykey;autoIncrement" json:"name"`
  Age  int64  `gorm:"default:18"`
}
`gorm:"aaa:bbb`
// default:默认值
// column:数据库中的字段名
```

---

# Golang IO

## textproto

```go
_, reader, err := ws.NextReader()
if err != nil {
    log.Fatalf("NextReader: %v", err)
}
readBuf := bufio.NewReader(reader)
mimeReader := textproto.NewReader(readBuf)
// 只读取MIME部分
cmr, err := mimeReader.ReadMIMEHeader()
// 只读取Body部分
dataBytes, err := io.ReadAll(readBuf)
if err != nil {
    log.Fatalf("io.ReadAll: %v", err)
}

//////////////
A:123
b:123

123
456
789
////////////
MIME:{"A":["123"],"B":["123"]}
BODY:123\n456\n789

如果MIME和BODY之间没有空一行，第一行的body会被忽略
```

`use of closed network connection` https://juejin.cn/post/6844903574720217095

# 开发总结

## gin 开发总结

1. ```
   type ModelMemberTag struct {
   	models.Model
   	TagDesc    string `gorm:"size:255;comment:会员标签描述" json:"tagDesc" binding:"required"`
   	RewardRate int    `gorm:"comment:会员返佣比（未除以100）" json:"rewardRate" binding:"required,gt=0"`
   	Price      int    `gorm:"comment:会员价格（分）" json:"price" binding:"required,gt=0"`
   	PerTime    string `gorm:"size:1;comment:会员单位：1:年，2:月" json:"perTime" binding:"required,oneof=1 2"`
   	models.ControlBy
   }
   ```

   1. 设计`model`时去除`models.Model`等公共部分，否则在联合查询时有冗余字段

# 思路

1. protobuf 集群主从通信
2. mqtt服务器
3. 分布式计算结合Raft
4. 十六进制，大小端序包的完善
5. 充当RTSP协议代理，与摄像头交互，得到的RTP包直接发送给前端解码

# bug验证

验证在go1.20下写的泛型代码是否在go1.21下被解决

# 框架

## go-gateway

- [x] 每个子服务可以动态开启关闭，需要注意每个子服务中的map属性的增删以及线程安全

- [ ] http代理
- [ ] http router 重构思路
- [ ] 音视频加解码和GPU交互
- [ ] 可以热操作已启动的服务
  - [ ] 重新加载配置
  - [ ] 重启

### 模块

1. 模块借鉴os微内核宏内核架构思路
1. [bug] 如果代理的地址访问后存在重定向地址，则会脱离代理服务器
1. [bug] 删除代理不会真正删除

#### elog

- [x] With 不显示参数
- [ ] source 调用栈
- [x] 所有子logger都从elog.With派生出，在向控制台输出时，会同时竞争锁

#### http反向代理

- [ ] 为反向代理提供命令行接口，服务在运行时可以动态修改，查看代理情况

- [x] 动态反向代理表，根据base path，端口

#### 其它

```
 protoc --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative *.proto
```

### **Envoy** 设计思路参考借鉴

https://cloud.tencent.com/developer/article/1744820

![image-20240826210432474](assets/image-20240826210432474.png)

#### Listener监听器

监听端口

#### Cluster集群

管理后端服务连接池、后端服务健康检查、服务及熔断

#### Filter过滤器

处理接收的客户端二进制数据并解析成结构化数据、进行流量治理

#### Route路由

Filter出具体结构化数据后选择一个Cluster转发给后端服务

#### 笔记

x Discovery Service。Listener、Cluster、Route有

- **LDS**：动态下发Listener配置，动态开关监听端口，更新Filter配置

- **CDS**：控制Envoy可以访问的服务

- **RDS**：路由规则动态更新和加载，动态路由的CRUD

Filter比较特殊，嵌入在 LDS/CDS/RDS 之内。比如Listener 除了监听端口，还有接收到的数据要执行哪些Filter链

1. start
2. Listener Filter(获取连接协议相关信息并进行插件链匹配)
3. Network Filter(解析二进制数据并匹配Cluser进行转发)
4. L7 Filter(负责治理解析后的具体数据)

![image-20240826213247224](assets/image-20240826213247224.png)

# websocket

```golang
	// httputil.ReverseProxy -> ServeHTTP websocket 部分，获取Connection头
	// 判断当前协议是否要提升为websocket
	reqUpType := upgradeType(outreq.Header)
	if !ascii.IsPrint(reqUpType) {
		p.getErrorHandler()(rw, req, fmt.Errorf("client tried to switch to invalid protocol %q", reqUpType))
		return
	}
	removeHopByHopHeaders(outreq.Header)

	// Issue 21096: tell backend applications that care about trailer support
	// that we support trailers. (We do, but we don't go out of our way to
	// advertise that unless the incoming client request thought it was worth
	// mentioning.) Note that we look at req.Header, not outreq.Header, since
	// the latter has passed through removeHopByHopHeaders.
	if httpguts.HeaderValuesContainsToken(req.Header["Te"], "trailers") {
		outreq.Header.Set("Te", "trailers")
	}

	// After stripping all the hop-by-hop connection headers above, add back any
	// necessary for protocol upgrades, such as for websockets.
	if reqUpType != "" {
		outreq.Header.Set("Connection", "Upgrade")
		outreq.Header.Set("Upgrade", reqUpType)
	}

```

# 杂项

```
var basepath string

func init() {
	_, currentFile, _, _ := runtime.Caller(0)
	basepath = filepath.Dir(currentFile)
}

// Path returns the absolute path the given relative file or directory path,
// relative to the google.golang.org/grpc/examples/data directory in the
// user's GOPATH.  If rel is already absolute, it is returned unmodified.
func Path(rel string) string {
	if filepath.IsAbs(rel) {
		return rel
	}

	return filepath.Join(basepath, rel)
}

```

# 工具

💻 `TranslucentTB` 透明工具栏

💻 `TrafficMonitor` 流量小窗显示

🖥️ `Quicker` PC自动化工具

🖥️ `AutoHotkey` PC自动化工具

🖥️ `Everything` PC搜索工具

🖥️ `Clover` PC资源管理器工具

🖥️ `Captura` `OBS` 录屏

📱 `Tasker` 安卓自动化工具

📱 `scrcpy` 安卓多屏协同

📱 `Autojs` 安卓自动化工具

# Windows激活

win10 激活 https://github.com/massgravel/Microsoft-Activation-Scripts

HWIDGen

KMSpico

# AI

https://www.liblib.art/

# RFC

https://www.rfc-editor.org/rfc/rfc9484

# AI画图

https://zhuanlan.zhihu.com/p/601903035

https://www.jianshu.com/p/0c4e7dcadc58

https://blog.csdn.net/weixin_40660408/article/details/130139799

https://civitai.com/

https://huggingface.co/

https://zhuanlan.zhihu.com/p/609524290

https://www.modb.pro/db/545532

# AI 想法

1. 遍历`@iconify/json`库中的所有图标索引，理解所有图标的名字。根据我输入的语义描述给我推荐合适的图标
2. 结合MCP协议，与本地操作系统文件结合，打造智能系统助手
3. 前端相关
   1. @iconify检索，根据语义推荐图标
   2. 集成ai生成表单功能
4. 本地markdown实时修改
5. 公式编辑器
6. 输入框优化
7. AI电台，播客
8. 企业知识库管理
   1. 整理和统计每个月考勤文件
   2. 公司规章制度导读
9. 开发框架的优化
   1. 系统字典的智能化提示，比如加入vscode插件智能CRUD字典

## 现有产品

1. monika
2. cherry studio
3. chat box
4. lobechat
5. deepchat

## API厂商类型

1. openai
2. gemini
3. ollma
4. anthropic

## 搜集的库

1. jsdom
2. chalk
3. zod
4. @llm-tools
5. openai
6. langchain
7. magic-string
8. sharp
9. llamaindex
10. @libsql/client
11. @sentry/node
12. [@lancedb/lancedb](https://www.npmjs.com/package/@lancedb/lancedb)
13. apache-arrow
14. [js-tiktoken](https://www.npmjs.com/package/js-tiktoken)

## 网站

1. https://modelscope.cn/mcp
2. https://mcp.so/
3. https://www.claudemcp.com/zh/servers

## 有用的库

https://github.com/pinkpixel-dev/deep-research-mcp

https://github.com/benborla/mcp-server-mysql

https://github.com/getsentry/sentry-javascript

# TODO

---

- **组件优化**
  1. **Affix**
     - [x] 外层target容器改变时，外部scroll时，affix的x,y不会实时更新，并且target的intersection不准确，比如左移时，x不会实时计算；组件偶现bug

  2. **Svg**
     - [ ] web和移动端；使用 iconify api缓存 emoji 数据至indexedDB，而不是通过全量引入的方式打包
     - [ ] pc端；在nodejs main process 中搭建iconify 服务，使用本地版本的 emoji

  3. **Markdown**
     - [x] 提升流式markdown数据渲染效率，目前是每当有新数据则整体渲染
     - [ ] 将数据的解析工作移入worker thread 或者 wasm 中

- **应用优化**
  - [ ] 关闭后显示在托盘栏
  - [ ] 替换logo
  - [ ] 安装时可以指定目录安装，不要直接安装
  - [ ] 重命名app 名字
  - [ ] 重构模型页的UI，模型的选择和筛选结构重构
  - [ ] 自动检查更新，部署后台服务器

- **MCP**
  - **流程：【携带本地可调用的tools+content请求llm】【llm返回tool_calls】【调用本地 tools】【调用结果再次发送给llm】【llm返回最终结果】 这个流程是一个loop，要体现在message中，而不是现在的所有tool calls放在顶部**

  - [x] 提示词，资源
  - [x] sse
  - [x] 优化`makeRequest`中requestHandler和toolRequestHandler
  - [ ] InMemory
    - [ ] **网络搜索功能**
  - [x] **restart MCP 会出现问题**
  - [x] 多轮调用时，token的统计量不准确
  - [ ] **mcp启动超时判断，并且可以手动终止启动，比如redis连不上时会一直请求**
  - [x] 右侧面板的mcp服务状态有问题，比如上次还在启动状态，关闭聊天后下次启动保留了上次的状态
  - [x] **模型mcp调用可能存在多种情况：**
    1. 一次消息返回中存在多个tool calls调用请求，即tool_calls长度大于1

    2. 一次call tool调用结束后，下次llm返回的消息继续存在下一个call tool

  - [ ] 网页版只能使用streamable，pc版可以使用stdio
  - [x] **目前的mcp数据结构，tool的名称为`名称__id`组合，需要重构**
  - [ ] uv和bun的环境配置中可能会存在问题，需要严格的判断uv和bun

- **RAG**
  - [ ] 嵌入，知识库开发
  - [ ] pdf,pptx,txt,md,html,docx,excel,dig

- **Logger**
  - [ ] 日志加入 namespace，用以区分模块
  - [ ] 日志匿名上报
  - [ ] 日志本地保存

- **优化&需求**
  - [ ] 消息类型分类，比如toolcall返回的消息，image消息，plaintext消息等
    - toolcall消息可以知道是哪个mcp服务器返回的消息

  - [ ] deep links

  - [ ] 全局消息记录搜索

  - [ ] ocr，tts，asr

  - [ ] llm,可以上传文本和图片实现简单的交互（非rag）

  - [ ] 用户消息可以restart时支持换个模型重新请求

  - [ ] 提供选项，输入的消息是否通过markdown渲染

  - [ ] html，vue，js代码块直接或者手动运行

  - [ ] 添加复制功能：复制原始内容，渲染后的内容，图片

  - [ ] llm消息的拼装放入worker thread中

  - [ ] 新的聊天快捷键，分为独立添加聊天和添加子聊天

  - [ ] 删除一个聊天的快捷键

# 搜集

## RAG

- 数据库排行榜：https://db-engines.com/en/ranking

![img](assets\RAG_FrameCompre.png)

![image-20240929145459119](assets\614524-20241010193314688-782182808.png)
