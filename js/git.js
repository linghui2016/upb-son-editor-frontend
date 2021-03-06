/**
 * Created by Jonas on 28.01.2017.
 */

function loadRepos(wsId) {
	$.ajax({
		url: serverURL + "workspaces/" + wsId + "/git/list",
		dataType: "json",
		xhrFields: {
			withCredentials: true
		},
		success: function (data) {
			tableViewModel.repos(data);
		}
	});
}

function pull(pt_id) {
	$.ajax({
		url: serverURL + "workspaces/" + wsId + "/git/pull",
		method: 'POST',
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		xhrFields: {
			withCredentials: true
		},
		data: JSON.stringify({'project_id': pt_id}),
		success: function (data) {
			$("#GitDialog").html(data.message.replace(/(\n)+/g, '<br />'));
		}
	});
}
function commit(pt_id) {
	$('#commitDialog').dialog({
		modal: true,
		buttons: {
			Commit: function () {
				$("#commitForm").parsley().validate();
				if ($("#commitForm").parsley().isValid()) {
					var commit_message = $('#commitInput').val();
					showWaitAnimation("Committing", "Committing project...");
					$.ajax({
						method: "POST",
						url: serverURL + "workspaces/" + wsId + "/git/commit",
						contentType: "application/json; charset=utf-8",
						dataType: "json",
						xhrFields: {
							withCredentials: true
						},
						data: JSON.stringify({
							"project_id": pt_id,
							"commit_message": commit_message
						}),
						success: function (data) {
							closeWaitAnimation();
							$('#GitDialog').dialog().text(data.message);
						}
					});
					$(this).dialog("close");
				}
			},
			Cancel: function () {
				$(this).dialog("close");
			}
		}
	});

}
function diff(pt_id) {
	$.ajax({
		url: serverURL + "workspaces/" + wsId + "/git/diff",
		method: 'POST',
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		xhrFields: {
			withCredentials: true
		},
		data: JSON.stringify({'project_id': pt_id}),
		success: function (data) {
			if (data.message) {
				$("#GitDialog").html(data.message.replace(/(\n)+/g, '<br />'));
			} else {
				$("#GitDialog").text("No differences!");
			}
		}
	});
}


function showStatus(wsId, pt_id, url) {
	showWaitAnimation();
	$.ajax({
		url: serverURL + "workspaces/" + wsId + "/git/status",
		method: 'POST',
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		xhrFields: {
			withCredentials: true
		},
		data: JSON.stringify({'project_id': pt_id}),
		success: function (data) {
			closeWaitAnimation();
			diffDialog = $("#GitDialog").dialog({
				modal: true,
				draggable: true,
				buttons: {
					"View on Github": function () {
						window.open(url, '_blank');
					},
					Diff: function () {
						diff(pt_id);
					},
					Pull: function () {
						pull(pt_id);
					},
					Commit: function () {
						commit(pt_id);
					},
					Ok: function () {
						$(this).dialog("close");
					}
				}
			});
			if (data.message) {
				diffDialog.html(data.message.replace(/(\n)+/g, '<br />'));
			} else {
				diffDialog.text("No differences!");
			}

		}
	});
}

function share(model) {
	$('#shareDialog').dialog({
		modal: true,
		buttons: {
			Share: function () {
				$('#shareForm').parsley().validate();
				if ($('#shareForm').parsley().isValid()) {
					var repo_name = $('#repoNameInput').val();
					//call share method on server
					init(model, repo_name);
					$(this).dialog("close");
				}
			},
			Cancel: function () {
				$(this).dialog("close");
				model.isShared(false);
			}
		}
	});
}

function init(model, repo_name) {
	showWaitAnimation("Sharing project on Github", "Initializing", 0);
	$.ajax({
		url: serverURL + "workspaces/" + wsId + "/git/init",
		method: 'POST',
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		xhrFields: {
			withCredentials: true
		},
		data: JSON.stringify({'project_id': model.id()}),
		success: function (data) {
			create(model, repo_name);
		},
		error: function () {
			model.isShared(false);
		}
	});
}

function create(model, repo_name) {
	showWaitAnimation("Sharing project on Github", "Uploading", 50);
	$.ajax({
		url: serverURL + "workspaces/" + wsId + "/git/create",
		method: 'POST',
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		xhrFields: {
			withCredentials: true
		},
		data: JSON.stringify({'project_id': model.id(), 'repo_name': repo_name}),
		success: function (data) {
			loadProjects(wsId);
			closeWaitAnimation();
		},
		error: function () {
			model.isShared(false);
		}
	});
}

function unshare(model) {
	$('#unshareDialog').dialog({
		modal: true,
		buttons: {
			"Delete from Github": function () {
				$('#unShareForm').parsley().validate();
				if ($('#unShareForm').parsley().isValid()) {
					var repo_name = $('#delRepoNameInput').val();
					deletePJ(model, repo_name);
					$(this).dialog("close");
				}
			},
			Cancel: function () {
				$(this).dialog("close");
				model.isShared(true);
			}
		}
	});
}

function deletePJ(model, repo_name) {
	showWaitAnimation("Deleting", "Deleting project from Github");
	$.ajax({
		url: serverURL + "workspaces/" + wsId + "/git/delete",
		method: 'DELETE',
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		xhrFields: {
			withCredentials: true
		},
		data: JSON.stringify({'project_id': model.id(), "repo_name": repo_name}),
		success: function (data) {
				closeWaitAnimation();
		},
		error: function () {
			model.isShared(true);
		}
	});
}
