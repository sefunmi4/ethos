# Git Account Integration

This guide outlines how Ethos connects a user's GitHub or GitLab account and maps tasks to a repository.

## Sign In and API Key

1. Generate a personal access token from your Git provider (GitHub or GitLab).
2. Send a `POST /api/git/account` request with the provider name, your git username and the token.
3. The backend stores a hashed version of the token so it is never returned in plain text.
4. Linked accounts are available from the response and can be used for repository operations.

## Mapping Tasks to a Repository

* After linking an account, connect a quest or project to a repository using `POST /api/git/connect`.
* The top task `T00` corresponds to the repository root directory.
* File posts appear as `F00`, `F01`, etc. They can be created without an initial task link and organized later by attaching them to specific tasks.
* Each file post shows additions and insertions similar to a commit diff.

## Task Posts and Subtasks

* Users can open a task and create reply posts to discuss or propose file updates.
* A reply of type `file` is treated as a subtask in the graph and can be tied to deliverables.
* Clicking on a task opens its post page where further replies and discussions can occur.

## Nested Folders and READMEs

* Repository folders may contain `README` files that act as planners, listing the files within that folder.
* Subfolders can contain their own `README` to describe nested structures.

This workflow allows Ethos to mirror repository structure within the task graph, enabling a seamless link between code changes and project deliverables.
