import BoardView from '../view/board.js';
import SortingView from '../view/sorting.js';
import TaskListView from '../view/task-list.js';
import LoadMoreButtonView from '../view/load-more-button.js';
import NoTasksView from '../view/no-tasks.js';
import {render, RenderPosition, remove} from "../utils/render.js";
import {sortTaskUp, sortTaskDown} from "../utils/task.js";
import {SortType, UpdateType, UserAction} from "../const.js";
import TaskPresenter from './task.js';

const TASK_COUNT_PER_STEP = 8;

export default class Board { // create components, add components into page, add event listeners
  constructor(boardContainer, tasksModel) {
    this._tasksModel = tasksModel;
    this._boardContainer = boardContainer;
    this._renderedTaskCount = TASK_COUNT_PER_STEP;
    this._currentSortType = SortType.DEFAULT;
    this._taskPresenters = {};

    this._boardComponent = new BoardView();
    this._taskListComponent = new TaskListView();
    this._sortingComponent = new SortingView();
    this._loadMoreButtonComponent = new LoadMoreButtonView();

    this._handleViewAction = this._handleViewAction.bind(this);
    this._handleModelEvent = this._handleModelEvent.bind(this);
    this._handleLoadMoreButtonClick = this._handleLoadMoreButtonClick.bind(this);
    this._handleSortTypeChange = this._handleSortTypeChange.bind(this);
    this._handleModeChange = this._handleModeChange.bind(this);

    this._tasksModel.addObserver(this._handleModelEvent);
  }

  init() {
    render(this._boardContainer, this._boardComponent, RenderPosition.BEFOREEND);
    render(this._boardComponent, this._taskListComponent, RenderPosition.BEFOREEND);

    this._renderBoard();
  }

  _getTasks() {
    switch (this._currentSortType) {
      case SortType.DATE_UP:
        return this._tasksModel.getTasks().slice().sort(sortTaskUp);
      case SortType.DATE_DOWN:
        return this._tasksModel.getTasks().slice().sort(sortTaskDown);
    }

    return this._tasksModel.getTasks();
  }

  // _handleTaskChange(updatedTask) { УДАЛИТЬ
  //   this._taskPresenters[updatedTask.id].init(updatedTask);
  // }

  _handleViewAction(actionType, updateType, update) {
    switch (actionType) {
      case UserAction.UPDATE_TASK:
        this._tasksModel.updateTask(updateType, update);
        break;
      case UserAction.ADD_TASK:
        this._tasksModel.addTask(updateType, update);
        break;
      case UserAction.DELETE_TASK:
        this._tasksModel.deleteTask(updateType, update);
        break;
    }
    // ОБНОВЛЯЕМ МОДЕЛЬ
    // actionType - действие пользователя, нужно чтобы понять, какой метод модели вызвать
    // updateType - тип изменений, нужно чтобы понять, что после нужно обновить
    // update - обновленные данные
  }

  _handleModelEvent(updateType, data) {
    switch (updateType) {
      case UpdateType.PATCH:
        this._taskPresenters[data.id].init(data);
        break;
      case UpdateType.MINOR:
        break;
      case UpdateType.MAJOR:
        break;
    }
    // ОБНОВЛЯЕМ ПРЕДСТАВЛЕНИЕ
    // В зависимости от типа изменений решаем, что делать:
    // - обновить часть списка (например, когда поменялось описание)
    // - обновить список (например, когда задача ушла в архив)
    // - обновить всю доску (например, при переключении фильтра)
  }

  _handleModeChange() {
    Object
      .values(this._taskPresenters)
      .forEach((presenter) => presenter.resetView());
  }

  _renderTask(task) {
    const taskPresenter = new TaskPresenter(this._taskListComponent, this._handleViewAction, this._handleModeChange);
    taskPresenter.init(task);
    this._taskPresenters[task.id] = taskPresenter;
  }

  _renderTasks(tasks) {
    tasks.forEach((task) => this._renderTask(task));
  }

  _renderTaskList() {
    const taskCount = this._getTasks().length;
    const tasks = this._getTasks().slice(0, Math.min(taskCount, TASK_COUNT_PER_STEP));

    this._renderTasks(tasks);

    if (taskCount > TASK_COUNT_PER_STEP) {
      this._renderLoadMoreButton();
    }
  }

  _clearTaskList() {
    Object
      .values(this._taskPresenters)
      .forEach((presenter) => presenter.destroy());
    this._taskPresenters = {};
    this._renderedTaskCount = TASK_COUNT_PER_STEP;
  }

  _renderNoTasks() {
    this._noTasksComponent = new NoTasksView();
    render(this._boardComponent, this._noTasksComponent, RenderPosition.AFTERBEGIN);
  }

  _handleSortTypeChange(sortType) {
    if (this._currentSortType === sortType) {
      return;
    }

    this._currentSortType = sortType;
    this._clearTaskList();
    this._renderTaskList();
  }

  _renderSorting() {
    render(this._boardComponent, this._sortingComponent, RenderPosition.AFTERBEGIN);
    this._sortingComponent.setSortTypeChangeHandler(this._handleSortTypeChange);
  }

  _handleLoadMoreButtonClick() {
    const taskCount = this._getTasks().length;
    const newRenderedTaskCount = Math.min(taskCount, this._renderedTaskCount + TASK_COUNT_PER_STEP);
    const tasks = this._getTasks().slice(this._renderedTaskCount, newRenderedTaskCount);

    this._renderTasks(tasks);
    this._renderedTaskCount += newRenderedTaskCount;

    if (this._renderedTaskCount >= taskCount) {
      remove(this._loadMoreButtonComponent);
    }
  }

  _renderLoadMoreButton() {
    render(this._boardComponent, this._loadMoreButtonComponent);

    this._loadMoreButtonComponent.setClickHandler(this._handleLoadMoreButtonClick);
  }

  _renderBoard() {
    if (this._getTasks().every((task) => task.isArchive)) {
      this._renderNoTasks();
      return;
    }

    this._renderSorting();
    this._renderTaskList();
  }
}
