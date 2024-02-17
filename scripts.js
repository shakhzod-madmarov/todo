const headerNav = document.querySelector("#headerNav");
const todoAddBtn = document.querySelector("#todoAddBtn");

let todoListArray = [];

let todosFilter = "all";
let filteredTodos = [];

/*
 Сохраняет список задач в локальное хранилище браузера.
 Преобразует массив задач в формат JSON и сохраняет его под ключом "todoList" в локальное хранилище.
 */

const saveTodos = () => {
  const todoJson = JSON.stringify(todoListArray);
  localStorage.setItem("todoList", todoJson);
};

const getTodos = () => JSON.parse(localStorage.getItem("todoList")) || [];

// добавляет обработчик события клика на кнопку добавления новой задачи.

todoAddBtn.addEventListener("click", (event) => {
  event.preventDefault();

  const todoText = document.getElementById("todoText").value;
  const todoDate = document.getElementById("todoDate").value;

  if (todoText && todoDate) {
    const todo = {
      text: todoText,
      date: todoDate,
      state: "pending",
      id: new Date().getTime(),
    };

    todoListArray = [...todoListArray, todo];
  }

  saveTodos();

  if (todosFilter === "all") {
    loadTodos();
  } else {
    filterTodos(todosFilter);
  }

  document.getElementById("todoText").value = "";
  document.getElementById("todoDate").value = "";
});

//загружает задачи для отображения на странице в соответствии с заданным фильтром и отфильтрованным списком задач.

const loadTodos = (filter, filteredTodos) => {
  const todosList = sortTodos(filteredTodos);
  const todoList = document.querySelector("#todosList");

  todoList.innerHTML = "";

  if (todosList.length === 0) {
    // const empty = filter
    //   ? `Нет заданий на ${filter} `
    //   : "Никаких задач не добавлено";
    const empty = "Никаких задач не добавлено";
    todoList.innerHTML = `<p>${empty}</p>`;
  } else {
    todosList.forEach((todo) => {
      const todoItem = document.createElement("li");
      todoItem.dataset.id = todo.id;
      todoItem.classList = `todos__item ${todo.state}`;

      const todoElement = createTodoElement(todo);
      todoItem.innerHTML = todoElement;
      todoList.appendChild(todoItem);
    });
  }
};

// сортирует список задач на основе их состояния и даты.

const sortTodos = (filteredTodos) => {
  const todoList = filteredTodos ? filteredTodos : getTodos();
  todoListArray = getTodos();

  todoList.sort((a, b) => {
    if (a.state === b.state) {
      return new Date(a.date) - new Date(b.date);
    } else {
      return a.state === "completed" ? 1 : -1;
    }
  });
  return todoList;
};

// создает HTML-элемент задачи на основе объекта задачи (todo).

const createTodoElement = (todo) => {
  const today = new Date().setHours(0, 0, 0, 0);
  const overdue =
    dateStringToDate(formatDate(todo.date)) < today && todo.state === "pending";
  const todoDateClass = overdue ? "todo-date overdue" : "todo-date";
  const todoBtnDoneClass =
    todo.state === "pending" ? "todo__btn--done" : "todo__btn--done checked";

  return `
  <div class="todo">
    <button type="button" class="${todoBtnDoneClass}">done</button>
    <div>
        <h2 class="todo-text">${todo.text}</h2>
        <p class="${todoDateClass}">${formatDate(todo.date)}</p>
    </div>
  </div>
  <button class="todo__btn--delete">Delete</button>
  `;
};

// добавляет обработчик события клика на элемент body.

document.body.addEventListener("click", (event) => {
  if (event.target.closest(".todo__btn--done")) {
    const todoItem = event.target.closest("li");
    toggleTodoState(todoItem);
  }

  if (event.target.closest(".todo__btn--delete")) {
    const todoItem = event.target.closest("li");
    deleteTodo(todoItem);
  }
});

// изменяет состояние задачи (на "выполнена" или "ожидает выполнения") и обновляет отображение задач в соответствии с текущим фильтром.

const toggleTodoState = (todoItem) => {
  const todoId = Number(todoItem.dataset.id);
  const todoIndex = todoListArray.findIndex((todo) => todo.id === todoId);

  if (todoIndex !== -1) {
    if (todoListArray[todoIndex].state === "pending") {
      todoListArray[todoIndex].state = "completed";
    } else if (todoListArray[todoIndex].state === "completed") {
      todoListArray[todoIndex].state = "pending";
    }

    saveTodos();
    if (todosFilter === "all") {
      loadTodos();
    } else {
      filterTodos(todosFilter);
    }
  }
};

// удаляет задачу из списка на основе переданного элемента задачи и обновляет отображение.

const deleteTodo = (todoItem) => {
  const todoId = Number(todoItem.dataset.id);

  todoListArray = todoListArray.filter((todo) => todo.id !== todoId);

  saveTodos();
  if (todosFilter === "all") {
    loadTodos();
  } else {
    filterTodos(todosFilter);
  }
};

// добавляет обработчик события клика на навигационные кнопки в заголовке.

headerNav.addEventListener("click", (event) => {
  const navBtns = headerNav.querySelectorAll("button");

  navBtns.forEach((button) => (button.classList = ""));

  const btn = event.target.closest("button");
  if (btn) {
    btn.classList = "active";
    let filter = btn.dataset.filter;
    filterTodos(filter);
  }
});

//фильтрует задачи в соответствии с выбранным фильтром и обновляет отображение на основе результата фильтрации.

const filterTodos = (filter) => {
  todosFilter = filter;
  const today = new Date().setHours(0, 0, 0, 0);

  switch (filter) {
    case "today":
      filteredTodos = getTodayTodos(today);
      loadTodos(filter, filteredTodos);
      break;

    case "overdue":
      filteredTodos = getOverdueTodos(today);
      loadTodos(filter, filteredTodos);
      break;

    case "scheduled":
      filteredTodos = getScheduledTodos(today);
      loadTodos(filter, filteredTodos);
      break;

    case "pending":
      filteredTodos = getStateTodos("pending");
      loadTodos(filter, filteredTodos);
      break;

    case "completed":
      filteredTodos = getStateTodos("completed");
      loadTodos(filter, filteredTodos);
      break;

    case "all":
    default:
      filteredTodos = [];
      loadTodos();
      break;
  }
};

//возвращает массив задач (todo items), запланированных на сегодняшнюю дату.

const getTodayTodos = (today) => {
  const todayFormatted = formatDate(today);
  const todayTodos = todoListArray.filter(
    (todo) =>
      formatDate(todo.date) === todayFormatted && todo.state === "pending"
  );

  return todayTodos;
};

// возвращает массив просроченных задач (todo items) на основе указанной даты.

const getOverdueTodos = (today) => {
  const overdueTodos = todoListArray.filter(
    (todo) =>
      dateStringToDate(formatDate(todo.date)) < today &&
      todo.state === "pending"
  );

  return overdueTodos;
};

// todo items, запланированных на будущие даты, относительно указанной даты.

const getScheduledTodos = (today) => {
  const scheduledTodos = todoListArray.filter(
    (todo) => dateStringToDate(formatDate(todo.date)) > today
  );

  return scheduledTodos;
};

// получение массив задач (todo items), отфильтрованный по их состоянию.

const getStateTodos = (state) => {
  const stateTodos = todoListArray.filter((todo) => todo.state === state);
  return stateTodos;
};

// получение даты в формате "dd/mm/yyyy".

const dateStringToDate = (dateString) => {
  const [day, month, year] = dateString.split("/");
  return new Date(year, month - 1, day);
};

// получение даты

const formatDate = (todoDate) => {
  const date = new Date(todoDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

loadTodos();
