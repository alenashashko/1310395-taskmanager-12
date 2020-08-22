import SiteMenuView from './view/site-menu.js';
import FilterView from './view/filter.js';
import BoardView from './view/board.js';
import SortingView from './view/sorting.js';
import TaskListView from './view/task-list.js';
import TaskEditView from './view/task-edit.js';
import TaskView from './view/task.js';
import LoadMoreButtonView from './view/load-more-button.js';
import {generateTask} from './mock/task.js';
import {generateFilter} from "./mock/filter.js";
import {render} from "./utils.js";

const TASK_COUNT = 22;
const TASK_COUNT_PER_STEP = 8;

const mainElement = document.querySelector(`main`);
const headerElement = mainElement.querySelector(`.main__control`);

const tasks = new Array(TASK_COUNT).fill().map(generateTask);
const filters = generateFilter(tasks);

const renderTask = (taskListElement, task) => {
  const taskComponent = new TaskView(task);
  let taskEditComponent;

  const replaceCardToForm = () => {
    taskListElement.replaceChild(taskEditComponent.getElement(), taskComponent.getElement());
  };

  const replaceFormToCard = () => {
    taskListElement.replaceChild(taskComponent.getElement(), taskEditComponent.getElement());
  };

  taskComponent.getElement().querySelector(`.card__btn--edit`).addEventListener(`click`, () => {
    if (!taskEditComponent) {
      taskEditComponent = new TaskEditView(task); // create component when click happen
    }
    replaceCardToForm();
  });

  if (taskEditComponent) {
    taskEditComponent.getElement().querySelector(`.card__form`).addEventListener(`submit`, (evt) => {
      evt.preventDefault();
      replaceFormToCard();
    });
  }

  render(taskListElement, taskComponent.getElement());
};

render(headerElement, new SiteMenuView().getElement());
render(mainElement, new FilterView(filters).getElement());

const boardComponent = new BoardView();
const TaskListComponent = new TaskListView();

render(mainElement, boardComponent.getElement());
render(boardComponent.getElement(), new SortingView().getElement());
render(boardComponent.getElement(), TaskListComponent.getElement());

for (let i = 0; i < Math.min(tasks.length, TASK_COUNT_PER_STEP); i++) {
  renderTask(TaskListComponent.getElement(), tasks[i]);
}

if (tasks.length > TASK_COUNT_PER_STEP) {
  let renderedTaskCount = TASK_COUNT_PER_STEP;

  const LoadMoreButtonComponent = new LoadMoreButtonView();

  render(boardComponent.getElement(), LoadMoreButtonComponent.getElement());

  LoadMoreButtonComponent.getElement().addEventListener(`click`, () => {
    tasks
      .slice(renderedTaskCount, renderedTaskCount + TASK_COUNT_PER_STEP)
      .forEach((task) => renderTask(TaskListComponent.getElement(), task));

    renderedTaskCount += TASK_COUNT_PER_STEP;

    if (renderedTaskCount >= tasks.length) {
      LoadMoreButtonComponent.getElement().remove(); // delete Dom-element
      LoadMoreButtonComponent.removeElement(); // set _element as null
    }
  });
}
